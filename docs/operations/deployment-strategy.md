# DeskHolt Deployment Strategy

Decision date: 2026-08-27
Decision owner: YUNI
Status: Active

## Current policy

DeskHolt will not be deployed to a VPS incrementally while individual project phases are still being completed.

- Vercel and the connected Neon resource are temporary validation infrastructure.
- A Vercel deployment labeled `Production` by the platform is not evidence that the final DeskHolt production rollout has been completed.
- Do not provision, copy releases to, migrate for, or switch traffic to a DeskHolt VPS until the entire project is complete and the owner explicitly authorizes the final production release.
- Do not execute P0-A3 T073–T082 as part of ordinary feature continuation.

## Final-release prerequisites

Before the future VPS deployment begins:

1. Declare the whole DeskHolt project release-ready.
2. Select and document the final production architecture: VPS topology, PostgreSQL provider, Redis, secret store, process manager, reverse proxy, domain/DNS, observability, and recovery ownership.
3. Establish automatic off-host database backups with approved retention and a successful restore test.
4. Recreate production identity, migration, populated-preservation, release-artifact, and traffic-drain evidence against the actual final target.
5. Produce a new operator-visible rollout and recovery runbook.
6. Obtain the exact human confirmations required by that final runbook before database or traffic changes.

## Existing environments

The current Vercel project and Neon database may be used for preview, integration, and acceptance testing. They must contain no irreplaceable production-only data and must not be treated as satisfying the future VPS backup, migration, or rollout gates.

## Superseded assumptions

Earlier P0-A3 evidence described a possible `deskholt.service` plus Nginx deployment under `/var/www/deskholt`. Read-only audit found no matching DeskHolt infrastructure on the known VPS. Those commands are retained only as historical planning material and are not authorized for execution.
