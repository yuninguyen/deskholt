# Contract: Product Access Policy

## Purpose

Provide one pure, exhaustive decision for every found Product and one shared query predicate for surfaces that may expose only indexable Products.

## Interface

```ts
type ProductAccessInput = {
  status: 'DRAFT' | 'ACTIVE' | 'BLOCKED' | 'ARCHIVED';
  is_indexed: boolean;
};

function evaluateProductAccess(
  input: ProductAccessInput
): ProductAccessDecision;
```

This function is called only after lookup found a Product. It does not accept or return missing.

## Closed output reasons

```text
draft
blocked
archived
explicit-noindex
eligible
```

No consumer may invent another reason.

## Precedence

```text
DRAFT    → draft, regardless of index flag
BLOCKED  → blocked, regardless of index flag
ARCHIVED → archived, regardless of index flag
ACTIVE + false → explicit-noindex
ACTIVE + true  → eligible
```

## Surface implications

| Reason | Public detail | Robots | Listing | Sitemap | Commerce |
|---|---:|---|---:|---:|---:|
| `draft` | no | N/A | no | no | no |
| `blocked` | no | N/A | no | no | no |
| `archived` | no | N/A | no | no | no |
| `explicit-noindex` | yes | `noindex,follow` | no | no | yes |
| `eligible` | yes | `index,follow` | yes | yes | yes |

## Query predicate

The module exports one Prisma-compatible predicate equivalent to:

```ts
{
  status: 'ACTIVE',
  is_indexed: true,
}
```

Homepage, category, and sitemap queries must compose this predicate rather than filter only `is_indexed` or retype divergent status logic.

## Missing lookup

Callers represent missing separately:

```ts
{ kind: 'missing' }
```

Missing has no Product decision or reason. Product detail/metadata return not found; `/go` preserves its separately specified redirect-home behavior.

## Test contract

- all eight status/index combinations produce the table above;
- malformed non-active/indexed combinations remain non-public/non-commerce;
- output reason belongs to the closed set;
- public, index, listing, sitemap, commerce, and robots implications cannot contradict one another;
- shared query predicate equals active plus indexed.
