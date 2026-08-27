# T073 / T004-P Production Operations Gate

Date: 2026-08-27
Decision: **STOPPED — gate not satisfied**

## Target clarification

The previously referenced SSH host `94.72.123.183` is not a DeskHolt production host. Read-only audit found no `deskholt.service`, no `/var/www/deskholt`, and no enabled DeskHolt Nginx site. It hosts unrelated `/opt/petposture` operations. No changes were made to that VPS.

The operator selected the current Vercel project plus Neon marketplace resource as the intended DeskHolt production target:

- Vercel project: `yuninguyens-projects/deskholt`
- Neon resource: `neon-byzantine-fence`
- Neon project ID: `quiet-shadow-23695099`
- Neon plan: Free
- PostgreSQL version: 18
- Region: AWS us-east-1

## Read-only populated identity

Inventory: `artifacts/p0-a3/production/t073-read-only-inventory.json`

- cluster system identifier: `7678693047037225472`
- database OID: `16396`
- database: `neondb`
- schema: `public`
- search path: `"$user", public`
- snapshot hash: `634913cbffd1a1681e85c43ca42d86bbe289e57cd7b66d18d9333bb922a34b76`
- Products: 20
- orphan counts: all zero
- migration-role privilege classification: PASS
- write probe: NOT PERFORMED

## Migration state blocker

The selected database already contains successful history rows for both migrations:

- `20260827014500_baseline_existing_schema`
- `20260827020000_p0_a3_basic_index_gate`

They were applied when this resource was provisioned for Vercel Preview. Therefore the selected target is already post-P0-A3 and cannot truthfully execute or prove the required pending sequence T075 baseline resolve → T076 verification → T077 feature deploy.

## Backup/restore blocker

Fresh Neon provider metadata reports:

- plan: Free
- `history_retention_seconds`: `21600` (6 hours)
- project created on 2026-08-27

This does not satisfy T004-P requirements for an identified automatic backup control with more than 30 days of retention/deletion evidence, current oldest-backup evidence, and an approved restore procedure/recent restore test. No external automatic `pg_dump` destination and retention system was selected.

## Operator decision

The operator selected:

- **Dừng tại T073**
- **Chưa thiết lập backup lúc này**

Accordingly:

- T073 remains incomplete/blocked by production prerequisites;
- T074 exact baseline-resolve confirmation was not requested;
- T075–T082 were not started;
- no production database write, migration, seed, traffic drain, or restore operation was performed;
- the current Vercel/Neon deployment must not be represented as a completed spec-compliant T073–T082 rollout.

## Superseding deployment-plan decision

The operator subsequently decided that DeskHolt must **not be deployed to a VPS until the entire project is complete**. Vercel + Neon are retained only as temporary validation infrastructure and must not be described as the final production rollout.

T073–T082 therefore remain intentionally deferred even if the immediate backup blocker is later removed. Resumption requires all of the following: an explicit whole-project completion/release decision, selection and approval of the final production architecture, a newly validated host/service/traffic-drain runbook, and fresh T004-P backup/retention/restore evidence. The historical systemd/Nginx procedure is not active authorization.
