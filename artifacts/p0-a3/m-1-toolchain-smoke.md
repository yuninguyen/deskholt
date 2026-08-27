# P0-A3 M-1 Toolchain Smoke

Date: 2026-08-25

## Runtime

- Node: `v24.9.0`
- npm: `11.14.1`
- Prisma CLI: `5.22.0`
- Prisma Client: `5.22.0`
- Engine hash: `605197351a3c8bdd595af2d2a9bc3025bca48ea2`
- Platform: Windows x64, binary target `windows`
- `npm ls prisma @prisma/client --depth=0`: exactly one effective version, both `5.22.0`

## Checks

- `npm install --package-lock-only --ignore-scripts`: passed; generated `package-lock.json` with exact Prisma pins.
- `npx --no-install prisma generate --schema prisma/schema.prisma`: passed after releasing a stale local Deskholt dev-process file lock.
- `npx --no-install prisma validate --schema prisma/schema.prisma`: passed.
- `npx --no-install prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code`: passed with `No difference detected.`
- `npm test`: passed, 43 tests, 0 failures.
- `prisma migrate status --schema prisma/schema.prisma`: expected unmanaged-database result; no migration found in `prisma/migrations`, database is not managed by Prisma Migrate.

## Notes

The initial Prisma generate attempt failed with a Windows EPERM rename because a pre-existing Deskholt development process held the query-engine DLL. The stale Deskholt processes were stopped, the exact generate command was rerun successfully, and no DSH GUI process was stopped. No baseline or feature migration has been generated or executed.
