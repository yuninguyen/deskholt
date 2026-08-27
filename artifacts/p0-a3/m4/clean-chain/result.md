# P0-A3 M4 Clean-chain Result

Date: 2026-08-27

Disposable target: `postgresql://postgres@127.0.0.1:55434/p0a3_clean_a154e02bc0f5`

The verifier staged a temporary Prisma root outside the repository, copied the schema/lock/baseline, and confirmed byte-identical source/copy hashes. It then:

1. deployed the baseline migration;
2. inserted a deterministic legacy Product with `is_indexed=true` and fixed `updated_at`;
3. copied the feature migration into the staged root and deployed it;
4. verified the legacy row became `ACTIVE + false` with unchanged non-target fields and `updated_at`;
5. verified a new Product defaults to `DRAFT + false`;
6. verified both partial unique indexes and both duplicate-rejection fixtures.

Results:

```text
baseline deploy:                 PASS
feature deploy:                  PASS
source/copy baseline hashes:     PASS
legacy ACTIVE + false:           PASS
legacy updated_at preserved:     PASS
legacy non-target fields:        PASS
new Product DRAFT + false:       PASS
product-scope partial index:     PASS
variant-scope partial index:     PASS
owned temporary root cleanup:    PASS
```

The verifier removed the staged root after evidence capture. The disposable database remains outside the populated source target and is not used for production operations.
