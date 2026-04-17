---
slug: typeorm-1-0
title: TypeORM 1.0 is here
authors: [michaelbromley, dlhck, naorpeled]
tags: [release, announcement]
description: TypeORM 1.0 is our commitment release - a stable API surface, dozens of new features, and the deprecations from the 0.3 cycle finally gone. Here's what's new and how to get there.
---

TypeORM 1.0 is here.

It's been almost a decade since TypeORM's first commit, and the project has only grown busier in that time. v1 is the release we put out when we were confident we could stand behind the API surface going forward — after eighteen months of careful work from the new maintainer team, a pile of features queued up across the 0.3 cycle, and a cleanup that was a long time coming.

This isn't a rewrite. If you've been running 0.3.28 in production, you already know how TypeORM feels. v1 is that — cleaner, faster, and on a foundation we're happy to build on for the next decade.

<!-- truncate -->

## By the numbers

From 0.3.28 to 1.0:

- **302 commits** in the v1 development cycle
- **40 contributors**
- **4M+ weekly downloads** on npm
- **36,400+ GitHub stars**
- **10 supported databases**, from Postgres to Spanner to MongoDB

TypeORM sits in the npm top 0.1% by downloads. Every one of those numbers is a codebase that trusts this ORM to keep working. That trust is why v1 took the time it did.

## What's new

The features that were queued up across the 0.3 cycle and waiting for a major:

**QueryBuilder**

- `valuesFromSelect()` for real `INSERT … SELECT` — no more dropping into raw SQL for bulk moves.
- `.returning()` on `update()` and `upsert()` where the database supports it.
- `ifExists` on `dropTable`, `dropDatabase`, and `dropIndex`.

**Transactions**

- DataSource-level `isolationLevel` honored across every driver, including Aurora Postgres and Google Spanner.

**PostgreSQL**

- Partial indexes via `@Index({ where: "..." })`.
- Automatic extension installation with `installExtensions: true`.
- Simpler enum modifications using `ALTER TYPE … ADD VALUE`.

**SQLite**

- `jsonb` column type.
- Encryption key support on React Native.

**Testing and resource safety**

- `clear({ cascade: true })` for `TRUNCATE … CASCADE` on Postgres, CockroachDB, and Oracle.
- Batched DROP statements in `clearDatabase()` for faster test setup.
- `await using` on `QueryRunner` — one fewer class of leaked-connection bugs.

**Type safety**

- `increment()` and `decrement()` are entity-aware. Typos caught at compile time.

And dozens of fixes across query generation, eager loading, soft delete, tree entities, and every driver. Full list in the [upgrading guide](/docs/releases/1.0/upgrading-from-0.3).

## Security hardening

v1 closes three attack surfaces that had been accumulating over the 0.3.x series: parameterized schema introspection and DDL, runtime validation on `orderBy` direction values, and semicolons rejected in raw SQL fragments (`select`, `addSelect`, `groupBy`, `orderBy`). Details in the [upgrading guide](/docs/releases/1.0/upgrading-from-0.3).

If you pipe user input through raw QueryBuilder fragments, rerun your tests after upgrading.

## The 0.3 deprecations are gone

Every API that was deprecated across the 0.3 cycle is removed in v1 — `Connection`, the global repository and manager functions, the `@EntityRepository` pattern, the IoC container integration, and the rest. Platform targets moved too: Node.js 20+, ES2023, `mysql2` over `mysql`, `better-sqlite3` over `sqlite3`, MongoDB driver v7+, Expo SDK v52+.

All of it is documented in the [upgrading guide](/docs/releases/1.0/upgrading-from-0.3), with before/after for every change. We'd rather you read that once than scroll through it here.

## Upgrading

One command:

```bash
npx @typeorm/codemod v1 src/
```

The codemod handles the rename-heavy work automatically — imports, method names, find-option syntax, dependency pins. It also scans your `package.json` and bumps ecosystem packages to v1-compatible versions, including `@nestjs/typeorm` to v11.0.1+ and the database drivers (`mongodb`, `mysql2`, `better-sqlite3`, `redis`, `mssql`, `@google-cloud/spanner`). For packages still pinned to removed APIs, it prints a warning.

For most codebases the codemod does about 80% of the upgrade. The rest — data integrity checks against the new INNER JOIN behavior on non-nullable relations, and `null`-in-where audits — is spelled out in the [upgrading guide](/docs/releases/1.0/upgrading-from-0.3).

## Thank you

v1 exists because 40 people shipped PRs in this cycle, because a steady stream of bug reports and reproductions kept us honest, and because sponsors on OpenCollective kept the lights on long enough to get here.

Special thanks to **Umed Khudoiberdiev** ([@pleerock](https://github.com/pleerock)) and **Dmitry Zotov** — TypeORM is their project originally. v1 is built on top of everything they shipped across the entire 0.x series. Thank you for trusting us to carry this forward.

Thanks to the current maintainer team carrying v1 over the line:

- **Michael Bromley** ([@michaelbromley](https://github.com/michaelbromley)) and **David Höck** ([@dlhck](https://github.com/dlhck)) on the steering committee, leading the transition we [announced last year](/blog/future-of-typeorm)
- **Lucian Mocanu** ([@alumni](https://github.com/alumni)) as technical lead
- Maintainers: **Naor Peled** ([@naorpeled](https://github.com/naorpeled)), **Giorgio Boa** ([@gioboa](https://github.com/gioboa)), **Piotr Kuczynski** ([@pkuczynski](https://github.com/pkuczynski)), **Mohammed Gomaa** ([@G0maa](https://github.com/G0maa)), **Julian Pufler** ([@pujux](https://github.com/pujux)), **Simon Garner** ([@sgarner](https://github.com/sgarner)), **Pieter Wigboldus** ([@w3nl](https://github.com/w3nl)), **Mike Guida** ([@mguida22](https://github.com/mguida22)), and **Prakhar Chauhan** ([@Cprakhar](https://github.com/Cprakhar))

And everyone pitching in from the Working Group.

To the 40+ contributors whose code is in this release: thank you. If your handle is in the CHANGELOG, something you wrote is running in production at thousands of companies by tomorrow morning.

If your company uses TypeORM and has never sponsored, this is a good time: [opencollective.com/typeorm](https://opencollective.com/typeorm). The path to the non-profit foundation we described last year is staffed by your sponsorship.

## Links

- [Upgrading from 0.3](/docs/releases/1.0/upgrading-from-0.3) — breaking changes, new features, and the full migration walkthrough
- [`@typeorm/codemod`](https://www.npmjs.com/package/@typeorm/codemod)
- [GitHub](https://github.com/typeorm/typeorm)
- [OpenCollective](https://opencollective.com/typeorm)
- [The Future of TypeORM (Oct 2024)](/blog/future-of-typeorm) — if you missed the governance announcement
