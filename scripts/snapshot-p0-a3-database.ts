import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { PrismaClient } from '@prisma/client';

export type SnapshotRecord = Record<string, unknown>;

export type IdentityFingerprint = {
  clusterSystemIdentifier: string | null;
  databaseOid: string;
  databaseName: string;
  schema: string;
  searchPath: string;
};

export type RolePrivilegeInput = {
  schemaUsage: boolean;
  schemaCreate: boolean;
  productOwnerOrMember: boolean;
  productUpdate: boolean;
  preservationSelect: boolean;
  catalogRead: boolean;
};

export function sortSnapshotRecords<T extends SnapshotRecord>(records: T[]): T[] {
  return [...records].sort((left, right) => {
    const leftKey = [left.table, left.id, JSON.stringify(left)].map(String).join('\u0000');
    const rightKey = [right.table, right.id, JSON.stringify(right)].map(String).join('\u0000');
    return leftKey.localeCompare(rightKey);
  });
}

export function stableSnapshotHash(records: SnapshotRecord[]): string {
  const normalized = sortSnapshotRecords(records);
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

export function compareIdentityFingerprint(
  approved: IdentityFingerprint,
  actual: IdentityFingerprint
): boolean {
  return (
    approved.clusterSystemIdentifier === actual.clusterSystemIdentifier &&
    approved.databaseOid === actual.databaseOid &&
    approved.databaseName === actual.databaseName &&
    approved.schema === actual.schema &&
    approved.searchPath === actual.searchPath
  );
}

export function classifyRolePrivileges(input: RolePrivilegeInput):
  | { status: 'PASS'; missing: [] }
  | { status: 'LIMITATION'; missing: string[] } {
  const missing = Object.entries(input)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return missing.length === 0
    ? { status: 'PASS', missing: [] }
    : { status: 'LIMITATION', missing };
}

export function redactDatasourceUrl(value: string): string {
  const url = new URL(value);
  if (url.password) url.password = '[REDACTED]';
  return url.toString().replace(/%5BREDACTED%5D/gi, '[REDACTED]');
}

function requiredExplicitUrl(): string {
  const value = process.env.P0_A3_TARGET_DATABASE_URL;
  if (!value?.trim()) {
    throw new Error('P0_A3_TARGET_DATABASE_URL is required; ambient DATABASE_URL is not accepted');
  }
  return value;
}

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function readIdentity(prisma: PrismaClient): Promise<IdentityFingerprint> {
  const [database, searchPath, schema] = await Promise.all([
    prisma.$queryRaw<Array<{
      database_name: string;
      database_oid: string;
      current_user_name: string;
    }>>`
      SELECT current_database() AS database_name,
             (SELECT oid::text FROM pg_database WHERE datname = current_database()) AS database_oid,
             current_user AS current_user_name
    `,
    prisma.$queryRaw<Array<{ search_path: string }>>`SELECT current_setting('search_path') AS search_path`,
    prisma.$queryRaw<Array<{ current_schema: string }>>`SELECT current_schema() AS current_schema`,
  ]);

  let clusterSystemIdentifier: string | null = null;
  try {
    const rows = await prisma.$queryRaw<Array<{ system_identifier: string }>>`
      SELECT system_identifier::text AS system_identifier FROM pg_control_system()
    `;
    clusterSystemIdentifier = rows[0]?.system_identifier ?? null;
  } catch {
    clusterSystemIdentifier = null;
  }

  const row = database[0];
  const currentSchema = schema[0]?.current_schema;
  if (!row?.database_oid || !row.database_name || !currentSchema || !searchPath[0]?.search_path) {
    throw new Error('Unable to obtain complete database identity fingerprint');
  }

  return {
    clusterSystemIdentifier,
    databaseOid: String(row.database_oid),
    databaseName: row.database_name,
    schema: currentSchema,
    searchPath: searchPath[0].search_path,
  };
}

async function readRolePrivileges(
  prisma: PrismaClient,
  schemaName: string
): Promise<{
  currentRole: string;
  productOwner: string | null;
  owningRoleMembership: boolean;
  checks: RolePrivilegeInput;
  classification: ReturnType<typeof classifyRolePrivileges>;
}> {
  const [roleRows, productRows, checks] = await Promise.all([
    prisma.$queryRaw<Array<{ current_role: string }>>`SELECT current_user AS current_role`,
    prisma.$queryRaw<Array<{ owner_name: string }>>`
      SELECT pg_get_userbyid(c.relowner) AS owner_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = ${schemaName} AND c.relname = 'products' AND c.relkind = 'r'
    `,
    prisma.$queryRaw<Array<RolePrivilegeInput>>`
      SELECT
        has_schema_privilege(current_user, ${schemaName}, 'USAGE') AS "schemaUsage",
        has_schema_privilege(current_user, ${schemaName}, 'CREATE') AS "schemaCreate",
        EXISTS (
          SELECT 1
          FROM pg_auth_members m
          JOIN pg_roles member_role ON member_role.oid = m.member
          JOIN pg_roles owning_role ON owning_role.oid = m.roleid
          WHERE member_role.rolname = current_user
            AND owning_role.rolname = pg_get_userbyid((
              SELECT c.relowner
              FROM pg_class c
              JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = ${schemaName} AND c.relname = 'products' AND c.relkind = 'r'
            )::oid)
        )
        OR EXISTS (
          SELECT 1
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = ${schemaName}
            AND c.relname = 'products'
            AND pg_get_userbyid(c.relowner) = current_user
        ) AS "productOwnerOrMember",
        has_table_privilege(current_user, ${schemaName} || '.products', 'UPDATE') AS "productUpdate",
        (
          has_table_privilege(current_user, ${schemaName} || '.products', 'SELECT')
          AND has_table_privilege(current_user, ${schemaName} || '.affiliate_links', 'SELECT')
          AND has_table_privilege(current_user, ${schemaName} || '.clicks', 'SELECT')
          AND has_table_privilege(current_user, ${schemaName} || '.conversions', 'SELECT')
          AND has_table_privilege(current_user, ${schemaName} || '.product_variants', 'SELECT')
          AND has_table_privilege(current_user, ${schemaName} || '.product_attributes', 'SELECT')
        ) AS "preservationSelect",
        has_schema_privilege(current_user, 'pg_catalog', 'USAGE') AS "catalogRead"
    `,
  ]);

  const currentRole = roleRows[0]?.current_role;
  const productOwner = productRows[0]?.owner_name ?? null;
  const privilegeChecks = checks[0];
  if (!currentRole || !privilegeChecks) throw new Error('Unable to obtain role privilege inventory');

  return {
    currentRole,
    productOwner,
    owningRoleMembership: privilegeChecks.productOwnerOrMember,
    checks: privilegeChecks,
    classification: classifyRolePrivileges(privilegeChecks),
  };
}

async function readInventory(prisma: PrismaClient, schemaName: string) {
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = ${schemaName} AND c.relkind = 'r'
    ORDER BY c.relname
  `;

  const tableCounts: SnapshotRecord[] = [];
  for (const table of tables) {
    const quotedSchema = `"${schemaName.replaceAll('"', '""')}"`;
    const quotedTable = `"${table.table_name.replaceAll('"', '""')}"`;
    const rows = await prisma.$queryRawUnsafe<Array<{ row_count: bigint }>>(
      `SELECT count(*)::bigint AS row_count FROM ${quotedSchema}.${quotedTable}`
    );
    tableCounts.push({ table: table.table_name, id: '', rowCount: Number(rows[0]?.row_count ?? 0) });
  }

  const products = await prisma.$queryRawUnsafe<SnapshotRecord[]>(`
    SELECT id, slug, name, category, description, image_url, specs, upc_code,
           user_sentiment, is_indexed, is_sustainable, created_at, updated_at
    FROM "${schemaName.replaceAll('"', '""')}"."products"
    ORDER BY id
  `);
  const affiliateLinks = await prisma.$queryRawUnsafe<SnapshotRecord[]>(`
    SELECT id, product_id, network, price, raw_url, tracking_url, is_in_stock,
           priority_order, last_crawled_at
    FROM "${schemaName.replaceAll('"', '""')}"."affiliate_links"
    ORDER BY id
  `);
  const clicks = await prisma.$queryRawUnsafe<SnapshotRecord[]>(`
    SELECT id, click_id, product_id, network, source_page, ip_hash, user_agent,
           us_state, created_at
    FROM "${schemaName.replaceAll('"', '""')}"."clicks"
    ORDER BY id
  `);
  const conversions = await prisma.$queryRawUnsafe<SnapshotRecord[]>(`
    SELECT id, click_id, order_value, commission, status, matched_at
    FROM "${schemaName.replaceAll('"', '""')}"."conversions"
    ORDER BY id
  `);
  const productVariants = await prisma.$queryRawUnsafe<SnapshotRecord[]>(`
    SELECT id, product_id, sku, size, color, material, is_active, created_at, updated_at
    FROM "${schemaName.replaceAll('"', '""')}"."product_variants"
    ORDER BY id
  `);
  const productAttributes = await prisma.$queryRawUnsafe<SnapshotRecord[]>(`
    SELECT id, product_id, variant_id, attribute_definition_id, value_string,
           value_number, value_boolean, source_url, source_type, confidence, verified_at
    FROM "${schemaName.replaceAll('"', '""')}"."product_attributes"
    ORDER BY id
  `);

  const orphanQueries: Record<string, string> = {
    affiliateLinksWithoutProducts: `SELECT count(*)::bigint AS count FROM "${schemaName}"."affiliate_links" a LEFT JOIN "${schemaName}"."products" p ON p.id = a.product_id WHERE p.id IS NULL`,
    clicksWithoutProducts: `SELECT count(*)::bigint AS count FROM "${schemaName}"."clicks" c LEFT JOIN "${schemaName}"."products" p ON p.id = c.product_id WHERE p.id IS NULL`,
    conversionsWithoutClicks: `SELECT count(*)::bigint AS count FROM "${schemaName}"."conversions" c LEFT JOIN "${schemaName}"."clicks" k ON k.click_id = c.click_id WHERE k.click_id IS NULL`,
    variantsWithoutProducts: `SELECT count(*)::bigint AS count FROM "${schemaName}"."product_variants" v LEFT JOIN "${schemaName}"."products" p ON p.id = v.product_id WHERE p.id IS NULL`,
    attributesWithoutProducts: `SELECT count(*)::bigint AS count FROM "${schemaName}"."product_attributes" a LEFT JOIN "${schemaName}"."products" p ON p.id = a.product_id WHERE p.id IS NULL`,
  };
  const orphanCounts: Record<string, number> = {};
  for (const [name, query] of Object.entries(orphanQueries)) {
    const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(query);
    orphanCounts[name] = Number(rows[0]?.count ?? 0);
  }

  const [enums, indexes, migrationTable, migrationRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<SnapshotRecord>>(`
      SELECT n.nspname AS schema_name, t.typname AS enum_name,
             array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE n.nspname = '${schemaName.replaceAll("'", "''")}'
      GROUP BY n.nspname, t.typname ORDER BY t.typname
    `),
    prisma.$queryRawUnsafe<Array<SnapshotRecord>>(`
      SELECT schemaname, tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = '${schemaName.replaceAll("'", "''")}'
      ORDER BY tablename, indexname
    `),
    prisma.$queryRaw<Array<{ migration_table: string | null }>>`SELECT to_regclass(${`${schemaName}._prisma_migrations`})::text AS migration_table`,
    prisma.$queryRawUnsafe<Array<SnapshotRecord>>(`
      SELECT migration_name, checksum, finished_at, rolled_back_at, logs
      FROM "${schemaName.replaceAll('"', '""')}"."_prisma_migrations"
      ORDER BY started_at, migration_name
    `).catch(() => []),
  ]);

  return {
    tables: tableCounts,
    productCount: products.length,
    records: sortSnapshotRecords([
      ...products.map((row) => ({ table: 'products', ...row })),
      ...affiliateLinks.map((row) => ({ table: 'affiliate_links', ...row })),
      ...clicks.map((row) => ({ table: 'clicks', ...row })),
      ...conversions.map((row) => ({ table: 'conversions', ...row })),
      ...productVariants.map((row) => ({ table: 'product_variants', ...row })),
      ...productAttributes.map((row) => ({ table: 'product_attributes', ...row })),
    ]),
    orphanCounts,
    enums,
    indexes,
    migrationTable: migrationTable[0]?.migration_table ?? null,
    migrationRows,
  };
}

export async function collectReadOnlyInventory(url = requiredExplicitUrl()) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const identity = await readIdentity(prisma);
    const privileges = await readRolePrivileges(prisma, identity.schema);
    const inventory = await readInventory(prisma, identity.schema);
    const snapshotHash = stableSnapshotHash(inventory.records);
    return {
      target: redactDatasourceUrl(url),
      identity,
      privileges,
      inventory,
      snapshotHash,
      writeProbe: 'NOT PERFORMED',
      readOnly: true,
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: P0_A3_TARGET_DATABASE_URL=<url> tsx scripts/snapshot-p0-a3-database.ts [--output <path>]');
    return;
  }
  const output = argValue(args, '--output') ?? 'artifacts/p0-a3/m0/read-only-inventory.json';
  const result = await collectReadOnlyInventory();
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output, target: result.target, identity: result.identity, snapshotHash: result.snapshotHash, readOnly: true }, null, 2));
}

if (process.argv[1]?.endsWith('snapshot-p0-a3-database.ts')) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
