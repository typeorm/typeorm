---
slug: typeorm-1-0
title: TypeORM 1.0 is here
tags: [release, announcement]
date: 2026-05-19
description: TypeORM 1.0 is out - the first major in almost five years. A stable API surface, dozens of new features, and a statement that TypeORM is here to stay.
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

### A cleaner API surface

`Connection` is now `DataSource`. The global `createConnection`, `getConnection`, `getRepository`, `getManager`, and friends, deprecated since v0.3, are gone, replaced by direct `dataSource.getRepository(...)` access.

- **Find options are object-shaped** - `relations: { profile: true, posts: true }` instead of `["profile", "posts"]`. Same for `select`. Better typing, better autocomplete, one canonical shape.
- **Repository methods consolidated** - `findOneBy({ id })` instead of `findOneById(id)`, `findBy({ id: In([…]) })` instead of `findByIds([…])`, `exists()` instead of `exist()`. One way to do each operation.
- **Custom repositories** - `@EntityRepository` and `getCustomRepository()` are gone; extend `Repository<Entity>` directly or attach methods to the repository you get from `dataSource.getRepository()`.

The codemod (below) handles every one of these renames automatically.

### Safer by default

- **`null` and `undefined` in `where` now throw** for high-level APIs (`find*`, repository/manager mutations, `queryBuilder.setFindOptions()`). QueryBuilder's `.where()`, `.andWhere()`, and `.orWhere()` are not affected, they pass through as-is. Use `IsNull()` for null matching, or set `invalidWhereValuesBehavior: { null: "ignore", undefined: "ignore" }` if you need to ignore them.
- **Non-nullable relations now use `INNER JOIN`.** If your schema says `nullable: false`, the query reflects that. Worth running an integrity check before you ship - orphaned rows will silently drop out of results where they used to leak through.

### Faster tests, cleaner schema work

- **Cascade truncate** - `repository.clear({ cascade: true })` issues `TRUNCATE … CASCADE` on PostgreSQL, CockroachDB, and Oracle. One call to wipe a table plus its dependents.
- **Batched DROP in `clearDatabase()`** - Postgres and CockroachDB consolidate individual drops into batched queries. Noticeably faster test setup.
- **`ifExists` on every drop method** - idempotent schema teardown without try/catch scaffolding.

### Predictable transactions everywhere

A DataSource-level `isolationLevel` is now honored by every driver that supports transactions, not just MS SQL Server. Aurora Postgres and Google Spanner are in the boat too - Spanner with `REPEATABLE READ` and `SERIALIZABLE`.

### Smoother data movement

- **`valuesFromSelect()`** on `InsertQueryBuilder` - real `INSERT … SELECT` without dropping into raw SQL for bulk moves.
- **`returning` on `update()` and `upsert()`** - no follow-up `SELECT` needed on databases that support `RETURNING`.

### Driver progress

- **MongoDB** - modernized to driver v7+, with object-based `select` projections that match the relational drivers.
- **PostgreSQL** - partial indexes via `@Index({ where: "..." })`, automatic extension installation, and cleaner `ALTER TYPE … ADD VALUE` for enum changes.
- **SAP HANA** - first-class `FOR UPDATE` locking, table comments via `@Entity({ comment: "..." })`, and a new pool timeout option.
- **SQLite** - `jsonb` column type.
- **React Native** - SQLite encryption key support.

### Type safety and resource management

- **Entity-aware typing** on `update()`, `increment()`, and `decrement()` - `any` is gone from these signatures.
- **`await using` on `QueryRunner`** - automatic cleanup when the scope exits, one fewer class of leaked-connection bug.

And dozens more bug fixes across query generation, eager loading, persistence, and every driver. Full list in the [upgrading guide](/docs/releases/1.0/upgrading-from-0.3).

## Security hardening

v1 closes three attack surfaces that had been accumulating over the 0.3.x series: parameterized schema introspection and DDL, runtime validation on `orderBy` direction values, and semicolons rejected in raw SQL fragments. Details in the [upgrading guide](/docs/releases/1.0/upgrading-from-0.3).

If you pipe user input through raw QueryBuilder fragments, rerun your tests after upgrading.

## Platform requirements

v1 raises the floor:

- **Node.js 20+** (was 14+)
- **ES2023** target
- **`mysql2`** only (the old `mysql` driver is gone)
- **`better-sqlite3`** only (`sqlite3` is gone)
- **MongoDB driver v7+**
- **Expo SDK v52+**

Other APIs that existed in v0.3 are also gone: `@RelationCount`, the IoC container integration, `TYPEORM_*` env auto-loading, the deprecated lock modes, and a handful of internal helpers. The [upgrading guide](/docs/releases/1.0/upgrading-from-0.3) has before/after for every change.

## Upgrading

One command:

```bash
npx @typeorm/codemod v1 src/
```

The codemod handles the rename-heavy work automatically - imports, method names, find-option syntax, dependency pins. It also scans your `package.json` and bumps ecosystem packages to v1-compatible versions, including `@nestjs/typeorm` to v11.0.1+ and the database drivers (`mongodb`, `mysql2`, `better-sqlite3`, `redis`, `mssql`, `@google-cloud/spanner`). For packages still pinned to removed APIs, it prints a warning.

For most codebases the codemod does about 80% of the upgrade. The rest - data integrity checks against the new INNER JOIN behavior on non-nullable relations, and `null`-in-where audits - is spelled out in the [upgrading guide](/docs/releases/1.0/upgrading-from-0.3).

## NestJS Integration

Many of you will be using TypeORM as part of a NestJS application. As part of this release we worked closely with the NestJS team to ensure a seamless upgrade - just make sure you're on [@nestjs/typeorm v11.0.1](https://github.com/nestjs/typeorm/releases/tag/11.0.1) which brings support for TypeORM v1.0.

## The team

If you've heard that TypeORM is dead or unmaintained, v1 is our answer. The project is actively maintained by an engaged team that has been shipping since late 2024:

- **Steering committee**: **Michael Bromley** ([@michaelbromley](https://github.com/michaelbromley)) and **David Hoeck** ([@dlhck](https://github.com/dlhck)), leading the transition we [announced last year](/blog/future-of-typeorm).
- **Technical lead**: **Lucian Mocanu** ([@alumni](https://github.com/alumni)).
- **Maintainers**: **Naor Peled** ([@naorpeled](https://github.com/naorpeled)), **Giorgio Boa** ([@gioboa](https://github.com/gioboa)), **Piotr Kuczynski** ([@pkuczynski](https://github.com/pkuczynski)), **Mohammed Gomaa** ([@G0maa](https://github.com/G0maa)), **Julian Pufler** ([@pujux](https://github.com/pujux)), **Simon Garner** ([@sgarner](https://github.com/sgarner)), **Pieter Wigboldus** ([@w3nl](https://github.com/w3nl)), **Mike Guida** ([@mguida22](https://github.com/mguida22)), **Shaun Smith** ([@smith-xyz](https://github.com/smith-xyz)), and **Prakhar Chhalotre** ([@Cprakhar](https://github.com/Cprakhar)).

Special thanks to **Umed Khudoiberdiev** ([@pleerock](https://github.com/pleerock)) and **Dmitry Zotov** - TypeORM is their project originally, and v1 is built on everything they shipped across the entire 0.x series.

v1 also wouldn't exist without the 40 contributors who shipped PRs in this cycle, everyone who filed issues with clear reproductions, and our sponsors on OpenCollective. Thank you.

If your company depends on TypeORM and has never sponsored, this is a good time: sponsor on [OpenCollective](https://opencollective.com/typeorm), or reach out at [maintainers@typeorm.io](mailto:maintainers@typeorm.io) to discuss other ways to support the project.

## Links

- [Upgrading from 0.3](/docs/releases/1.0/upgrading-from-0.3) - the full migration walkthrough with before/after for every change
- [`@typeorm/codemod`](https://www.npmjs.com/package/@typeorm/codemod)
- [GitHub](https://github.com/typeorm/typeorm)
- [OpenCollective](https://opencollective.com/typeorm)
- [The Future of TypeORM (Oct 2024)](/blog/future-of-typeorm) - if you missed the governance announcement
