---
slug: typeorm-1-0
title: TypeORM 1.0 is here
tags: [release, announcement]
date: 2026-04-17
description: TypeORM 1.0 is out - the first major in almost five years. A stable API surface, dozens of new features, and a statement that TypeORM is here to stay.
---

TypeORM v1.0 is out now!

It has been a long road, but we finally made it. TypeORM has been around since 2016, and is one of the most widely-used ORM libraries in the Node.js ecosystem. But it has been stuck in pre-1.0 limbo for that entire time, a fact which does not accurately reflect what the project has grown into over the years.

Pre-1.0 software signals instability and immaturity, when the reality is that TypeORM is one of the most mature, stable and performant Node.js ORM solutions. In fact, it has gone without breaking changes for almost 5 years since the release of v0.3 way back in 2021.

When new maintainers took over the project at the end of 2024, our first goal was to get back on track with regular releases and to start dealing with the backlog of issues and PRs that had built up over the previous couple of years where TypeORM had gone without regular maintenance. We achieved that, and through 2025 we released 8 patch versions, merged 575 PRs (vs 63 the previous year) and closed over 2,300 issues!

Over the past several months, the team has been focused on the next major target: to release v1.0 and signal that TypeORM is here to stay as a stable, mature and well-maintained open source project. This has been a huge effort and countless hours have gone into the work needed to get us here.

The TypeORM team and community is proud to present v1.0. This post covers what you need to know about upgrading.

<!-- truncate -->

## What's new

v1 ships dozens of features that had been queued up during the 0.3 cycle. A tour of the highlights:

### Developer experience

- **`@typeorm/codemod`** — a new package that automates most of the v1 upgrade in one command. More on this below.
- **Explicit resource management on `QueryRunner`** — `await using` (TypeScript 5.2+) releases the runner automatically when the scope exits. One fewer class of leaked-connection bug.
- **`ifExists` across every drop method** — `dropTable`, `dropColumn`, `dropIndex`, `dropPrimaryKey`, `dropForeignKey`, `dropUniqueConstraint`, `dropCheckConstraint`, `dropExclusionConstraint`, and their plural variants all accept an `ifExists` flag for idempotent migrations.
- **Cascade truncate in `clear()`** — `repository.clear({ cascade: true })` issues `TRUNCATE … CASCADE` on PostgreSQL, CockroachDB, and Oracle. Fast test setup without handling foreign keys by hand.
- **Entity-aware typing for `increment()` and `decrement()`** — `any` is gone from the conditions parameter; your entity's columns drive autocomplete and type checking.

### QueryBuilder

- **`INSERT INTO … SELECT`** — a new `valuesFromSelect()` method on `InsertQueryBuilder` for data migration and transformation queries. No more dropping into raw SQL for bulk moves.
- **`returning` option on `update()` and `upsert()`** — on databases that support `RETURNING`, you don't need a follow-up `SELECT`.

### Transactions

- **DataSource-level default isolation level** — `DataSourceOptions.isolationLevel` is now honored by every driver that supports transactions, not just MS SQL Server.
- **Aurora Postgres and Google Spanner** now honor the setting. Spanner supports `REPEATABLE READ` (preview) and `SERIALIZABLE`.

### Driver improvements

- **PostgreSQL** — partial indexes via `@Index({ where: "..." })`, a new `installExtensions` option for additional Postgres extensions on connection, and `ALTER TYPE … ADD VALUE` for enum changes instead of the old four-step rename dance.
- **MongoDB** — object-based `select` projection now matches the other drivers (`select: { id: true, name: true }`). The driver requirement moves to v7+.
- **SAP HANA** — `FOR UPDATE` and other lock modes in `SELECT`, `@Entity({ comment: "..." })` table comments, and a new `maxWaitTimeoutIfPoolExhausted` pool option.
- **SQLite** — `jsonb` column type.
- **React Native** — SQLite encryption key option.

### Decorators

- **`@Exclusion` now supports `deferrable`**, matching `@Unique` and `@Index`.

And dozens of bug fixes across query generation, relations and eager loading, persistence, and every driver. If you've been hitting a long-standing issue, it's almost certainly fixed.

## Security hardening

v1 closes three attack surfaces that had been accumulating over the 0.3.x series: parameterized schema introspection and DDL, runtime validation on `orderBy` direction values, and semicolons rejected in raw SQL fragments (`select`, `addSelect`, `groupBy`, `orderBy`). Details in the [upgrading guide](/docs/releases/1.0/upgrading-from-0.3).

If you pipe user input through raw QueryBuilder fragments, rerun your tests after upgrading.

## The 0.3 deprecations are gone

Every API that was deprecated across the 0.3 cycle is removed in v1 — `Connection`, the global repository and manager functions, the `@EntityRepository` pattern, the IoC container integration, and the rest. Platform targets moved too: Node.js 20+, ES2023, `mysql2` over `mysql`, `better-sqlite3` over `sqlite3`, MongoDB driver v7+, Expo SDK v52+.

All of it is documented in the [upgrading guide](/docs/releases/1.0/upgrading-from-0.3), with before/after for every change.

## Upgrading

One command:

```bash
npx @typeorm/codemod v1 src/
```

The codemod handles the rename-heavy work automatically — imports, method names, find-option syntax, dependency pins. It also scans your `package.json` and bumps ecosystem packages to v1-compatible versions, including `@nestjs/typeorm` to v11.0.1+ and the database drivers (`mongodb`, `mysql2`, `better-sqlite3`, `redis`, `mssql`, `@google-cloud/spanner`). For packages still pinned to removed APIs, it prints a warning.

For most codebases the codemod does about 80% of the upgrade. The rest — data integrity checks against the new INNER JOIN behavior on non-nullable relations, and `null`-in-where audits — is spelled out in the [upgrading guide](/docs/releases/1.0/upgrading-from-0.3).

## NestJS Integration

Many of you will be using TypeORM as part of a NestJS application. As part of this release we worked closely with the NestJS team to ensure a seamless upgrade - just make sure you're on [@nestjs/typeorm v11.0.1](https://github.com/nestjs/typeorm/releases/tag/11.0.1) which brings support for TypeORM v1.0.

## The team

If you've heard that TypeORM is dead or unmaintained, v1 is our answer. The project is actively maintained by an engaged team that has been shipping since late 2024:

- **Steering committee**: **Michael Bromley** ([@michaelbromley](https://github.com/michaelbromley)) and **David Hoeck** ([@dlhck](https://github.com/dlhck)), leading the transition we [announced last year](/blog/future-of-typeorm).
- **Technical lead**: **Lucian Mocanu** ([@alumni](https://github.com/alumni)).
- **Maintainers**: **Naor Peled** ([@naorpeled](https://github.com/naorpeled)), **Giorgio Boa** ([@gioboa](https://github.com/gioboa)), **Piotr Kuczynski** ([@pkuczynski](https://github.com/pkuczynski)), **Mohammed Gomaa** ([@G0maa](https://github.com/G0maa)), **Julian Pufler** ([@pujux](https://github.com/pujux)), **Simon Garner** ([@sgarner](https://github.com/sgarner)), **Pieter Wigboldus** ([@w3nl](https://github.com/w3nl)), **Mike Guida** ([@mguida22](https://github.com/mguida22)), **Shaun Smith** ([@smith-xyz](https://github.com/smith-xyz)), and **Prakhar Chhalotre** ([@Cprakhar](https://github.com/Cprakhar)).

Backed by a working group of companies and contributors who ship alongside us.

Special thanks to **Umed Khudoiberdiev** ([@pleerock](https://github.com/pleerock)) and **Dmitry Zotov** — TypeORM is their project originally, and v1 is built on everything they shipped across the entire 0.x series.

v1 also wouldn't exist without the 40 contributors who shipped PRs in this cycle, everyone who filed issues with clear reproductions, and our sponsors on OpenCollective. Thank you.

If your company depends on TypeORM and has never sponsored, this is a good time: [opencollective.com/typeorm](https://opencollective.com/typeorm). The path to the non-profit foundation we described last year is funded by contributions.

## Links

- [Upgrading from 0.3](/docs/releases/1.0/upgrading-from-0.3) — the full migration walkthrough with before/after for every change
- [`@typeorm/codemod`](https://www.npmjs.com/package/@typeorm/codemod)
- [GitHub](https://github.com/typeorm/typeorm)
- [OpenCollective](https://opencollective.com/typeorm)
- [The Future of TypeORM (Oct 2024)](/blog/future-of-typeorm) — if you missed the governance announcement
