# P0-A3 Compatible Release Artifact Status

Date: 2026-08-27

## Verified release inputs

- Next.js: 16.3.0;
- React / React DOM: exact 19.0.0;
- Prisma / Prisma Client: exact 5.22.0;
- production build: PASS;
- full tests: 171/171 PASS;
- lint and TypeScript: PASS;
- disposable publishing/cache/migration verifiers: PASS;
- built startup and route smoke: PASS.

## Immutable packaged artifact

A secret-free deployment package was created outside the repository from the verified production build. It contains `.next` (excluding development/cache data), `public`, exact package manifests, `next.config.mjs`, Prisma schema, and the approved baseline/P0-A3 migrations. It does not contain `.env`, credentials, source inventories, or database dumps.

```text
artifact: C:\Users\YUNI-S~1\AppData\Local\Temp\deskholt-p0-a3-release-20260827-163001.zip
bytes: 7397952
SHA-256: ac601ad5bd46e3e2c3ec66875ffae9c3a5298f74d18c71f529c3913f9400e367
```

Environment/config manifest required at rollout: Node 24, PostgreSQL datasource supplied by the production secret store, canonical origin, Redis URL, Admin password/session secret, click hash salt, and the exact package lock included in the archive. Secrets must not be copied into the archive or evidence.

Deployment order while traffic remains drained:

1. verify archive SHA-256;
2. unpack into a new release directory;
3. run `npm ci` from the included lockfile and `npx prisma generate` without seed/reset/db-push;
4. after T075–T077 authorize and apply the database steps, start the release with `npm start` bound to the production internal interface;
5. perform only T078 read-only/internal smoke;
6. keep traffic drained through T079 populated postcheck;
7. atomically switch traffic only at T080.

Rollback/recovery: on any M6 ambiguity or smoke/postcheck failure, keep traffic drained, retain the previous application release, stop the new process, preserve logs/snapshots, and invoke the separately approved database recovery procedure without retry, manual data repair, reset, or db-push.

## Deployment deferral update

Operator decision on 2026-08-27 supersedes immediate execution of the VPS handoff below: **do not deploy DeskHolt to a VPS until the entire project is complete**. The commands remain historical release-readiness material only and are not an active rollout authorization. Vercel + Neon remain temporary validation infrastructure, not the final production architecture. Before any future VPS rollout, replace or reapprove this runbook against the actual host, service, backup/restore controls, release artifact, and completed-project architecture.

## Named operator handoff — deferred historical procedure

Named operator: **YUNI, DeskHolt project owner**, confirmed in-session. The previously planned production process contract was `deskholt.service`; Nginx site `/etc/nginx/sites-enabled/deskholt` with source `/etc/nginx/sites-available/deskholt`. No matching DeskHolt VPS infrastructure currently exists or has been authorized for deployment.

Traffic-drain commands for T077:

```bash
set -euo pipefail
sudo test -L /etc/nginx/sites-enabled/deskholt
sudo rm /etc/nginx/sites-enabled/deskholt
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl stop deskholt.service
sudo systemctl is-inactive --quiet deskholt.service
```

The operator must then verify the production hostname no longer serves DeskHolt public or Admin traffic before any database operation. Keep the Nginx site disabled through T079.

Release staging and internal rollout commands after the separately authorized M6 database step:

```bash
set -euo pipefail
RELEASE=/var/www/deskholt/releases/ac601ad5bd46e3e2c3ec66875ffae9c3a5298f74d18c71f529c3913f9400e367
sudo install -d -o "$USER" -g "$USER" "$RELEASE"
sha256sum deskholt-p0-a3-release-20260827-163001.zip
# Require exact output: ac601ad5bd46e3e2c3ec66875ffae9c3a5298f74d18c71f529c3913f9400e367
unzip -q deskholt-p0-a3-release-20260827-163001.zip -d "$RELEASE"
cd "$RELEASE"
npm ci
npx prisma generate
sudo ln -sfn "$RELEASE" /var/www/deskholt/current
sudo systemctl start deskholt.service
sudo systemctl is-active --quiet deskholt.service
curl --fail --silent --show-error http://127.0.0.1:3000/ >/dev/null
```

T078 smoke remains internal/read-only while the Nginx site is disabled. T080 traffic restore, only after T079 passes:

```bash
set -euo pipefail
sudo ln -s /etc/nginx/sites-available/deskholt /etc/nginx/sites-enabled/deskholt
sudo nginx -t
sudo systemctl reload nginx
```

Recovery while traffic remains drained: stop `deskholt.service`, restore `/var/www/deskholt/current` to the previously recorded release symlink, restart the previous app only for internal diagnosis, preserve logs and snapshots, and keep the Nginx site disabled. Database recovery follows the T073-approved backup/restore procedure; never retry the migration, run seed/reset/db-push, or perform manual data repair.

## Release artifact decision

**T072 COMPLETE for release readiness.** The exact immutable archive/checksum, environment manifest, disposable startup/runtime proof, deployment order, traffic-drain commands, recovery boundary, and named operator handoff are recorded. This does not authorize execution.

T073+, M5 and M6 remain prohibited until T004-P evidence and the exact T074 confirmation exist. No production operation was performed.