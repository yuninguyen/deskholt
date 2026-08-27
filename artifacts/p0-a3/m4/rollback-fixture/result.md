# P0-A3 M4 Rollback Fixture Result

Date: 2026-08-27

Disposable target: `postgresql://postgres@127.0.0.1:55434/p0a3_failure_29902523fb39`

The verifier staged a separate temporary Prisma root containing only the copied lock/baseline before adding one distinctly named failure migration:

```text
20260827021000_p0_a3_rollback_fixture
```

The failure migration was the feature SQL with `DO $$ BEGIN RAISE EXCEPTION 'P0_A3_ROLLBACK_FIXTURE'; END $$;` inserted after the backfill and before `COMMIT`.

Results:

```text
baseline deploy:                 PASS
feature fixture deploy fails:    PASS (exit 1 / P3018)
feature enum remains absent:     PASS
feature status column absent:    PASS
legacy is_indexed remains true:  PASS
legacy updated_at preserved:     PASS
failure marker in history name:  PASS
server log contains marker:      PASS
owned temporary root cleanup:    PASS
```

PostgreSQL server log evidence was captured in the disposable cluster log and contains `ERROR: P0_A3_ROLLBACK_FIXTURE`. Prisma 5.22.0 records the failed `_prisma_migrations` row with `logs = NULL` for this SQL failure; the migration row name contains the marker and the server log preserves the exact exception marker. This implementation does not fabricate or manually update migration history.

The source/version-controlled feature migration remained byte-identical; no repository migration directory was moved, hidden, or edited for the fixture.
