import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import test from 'node:test';

const repositoryRoot = resolve(process.cwd());
const activeSeedPath = join(repositoryRoot, 'prisma', 'seed.ts');
const legacySeedPath = join(repositoryRoot, 'prisma', 'seed.js');

const OPERATIONAL_ROOT_FILES = [
  'package.json',
  'package-lock.json',
  'eslint.config.mjs',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'README.md',
];
const OPERATIONAL_DIRECTORIES = ['prisma', 'scripts', 'src'];
const OPERATIONAL_EXTENSIONS = new Set([
  '.cjs',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ps1',
  '.sh',
  '.toml',
  '.ts',
  '.yaml',
  '.yml',
]);

function collectOperationalFiles(path: string): string[] {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return OPERATIONAL_EXTENSIONS.has(extname(path)) ? [path] : [];

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(path, entry.name);
    return entry.isDirectory() ? collectOperationalFiles(entryPath) : collectOperationalFiles(entryPath);
  });
}

test('active TypeScript seed creates no indexable Product', () => {
  const source = readFileSync(activeSeedPath, 'utf8');

  assert.doesNotMatch(source, /\bis_indexed\s*:\s*true\b/);
  assert.match(source, /\bstatus\s*:\s*['"]DRAFT['"]/);
  assert.match(source, /\bis_indexed\s*:\s*false\b/);
});

test('legacy JavaScript seed file is removed', () => {
  assert.equal(existsSync(legacySeedPath), false, 'prisma/seed.js must not exist');
});

test('operational files do not reference the legacy JavaScript seed', () => {
  const files = [
    ...OPERATIONAL_ROOT_FILES.map((path) => join(repositoryRoot, path)),
    ...OPERATIONAL_DIRECTORIES.flatMap((path) => collectOperationalFiles(join(repositoryRoot, path))),
  ];
  const references = [...new Set(files)]
    .filter((path) => path !== legacySeedPath && existsSync(path))
    .filter((path) => /prisma[\\/]seed\.js/.test(readFileSync(path, 'utf8')))
    .map((path) => relative(repositoryRoot, path).replaceAll('\\', '/'))
    .sort();

  assert.deepEqual(references, []);
});
