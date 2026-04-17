---
slug: typeorm-1-0
title: TypeORM 1.0 is here
authors: [michaelbromley, dlhck, naorpeled]
tags: [release, announcement]
date: 2026-04-17
description: TypeORM 1.0 is out - the first major in almost five years, a stable API surface, and a new chapter for the project. Here's what's new and how to upgrade.
---

TypeORM v1.0 is out now!

It has been a long road, but we finally made it. TypeORM has been around since 2016, and is one of the most widely-used ORM libraries in the Node.js ecosystem. But it has been stuck in pre-1.0 limbo for that entire time, a fact which does not accurately reflect what the project has grown into over the years.

Pre-1.0 software signals instability and immaturity, when the reality is that TypeORM is one of the most mature, stable and performant Node.js ORM solutions. In fact, it has gone without breaking changes for almost 5 years since the release of v0.3 way back in 2021.

When new maintainers took over the project at the end of 2024, our first goal was to get back on track with regular releases and to start dealing with the backlog of issues and PRs that had built up over the previous couple of years where TypeORM had gone without regular maintenance. We achieved that, and through 2025 we released 8 patch versions, merged 575 PRs (vs 63 the previous year) and closed over 2,300 issues!

Over the past several months, the team has been focused on the next major target: to release v1.0 and signal that TypeORM is here to stay as a stable, mature and well-maintained open source project. This has been a huge effort and countless hours have gone into the work needed to get us here.

The TypeORM team and community is proud to present v1.0. This post covers what you need to know about upgrading.

<!-- truncate -->

## By the numbers

From 0.3.28 to 1.0:

- **302 commits** in the v1 development cycle
- **40 contributors**
- **4M+ weekly downloads** on npm (top 0.1%)
- **36,400+ GitHub stars**
- **10 supported databases**, from Postgres to Spanner to MongoDB

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

## NestJS Integration

Many of you will be using TypeORM as part of a NestJS application. As part of this release we worked closely with the NestJS team to ensure a seamless upgrade - just make sure you're on [@nestjs/typeorm v11.0.1](https://github.com/nestjs/typeorm/releases/tag/11.0.1) which brings support for TypeORM v1.0.

## Thank you

A huge shoutout to the 40 contributors who shipped PRs in this cycle, to everyone who filed bugs with clear reproductions, and to the sponsors on OpenCollective whose ongoing support keeps this work possible.

Special thanks to **Umed Khudoiberdiev** ([@pleerock](https://github.com/pleerock)) and **Dmitry Zotov** — TypeORM is their project originally. v1 is built on top of everything they shipped across the entire 0.x series. Thank you for trusting us to carry this forward.

Thanks to the current maintainer team carrying v1 over the line:

- **Michael Bromley** ([@michaelbromley](https://github.com/michaelbromley)) and **David Hoeck** ([@dlhck](https://github.com/dlhck)) on the steering committee, leading the transition we [announced last year](/blog/future-of-typeorm)
- **Lucian Mocanu** ([@alumni](https://github.com/alumni)) as technical lead
- Maintainers: **Naor Peled** ([@naorpeled](https://github.com/naorpeled)), **Giorgio Boa** ([@gioboa](https://github.com/gioboa)), **Piotr Kuczynski** ([@pkuczynski](https://github.com/pkuczynski)), **Mohammed Gomaa** ([@G0maa](https://github.com/G0maa)), **Julian Pufler** ([@pujux](https://github.com/pujux)), **Simon Garner** ([@sgarner](https://github.com/sgarner)), **Pieter Wigboldus** ([@w3nl](https://github.com/w3nl)), **Mike Guida** ([@mguida22](https://github.com/mguida22)), **Shaun Smith** ([@smith-xyz](https://github.com/smith-xyz)), and **Prakhar Chhalotre** ([@Cprakhar](https://github.com/Cprakhar))

And everyone pitching in from the Working Group.

If your company uses TypeORM and has never sponsored, this is a good time: [opencollective.com/typeorm](https://opencollective.com/typeorm). The path to the non-profit foundation we described last year is staffed by your sponsorship.

## Links

- [Upgrading from 0.3](/docs/releases/1.0/upgrading-from-0.3) — breaking changes, new features, and the full migration walkthrough
- [`@typeorm/codemod`](https://www.npmjs.com/package/@typeorm/codemod)
- [GitHub](https://github.com/typeorm/typeorm)
- [OpenCollective](https://opencollective.com/typeorm)
- [The Future of TypeORM (Oct 2024)](/blog/future-of-typeorm) — if you missed the governance announcement
