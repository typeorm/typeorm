---
slug: typeorm-1-0
title: TypeORM 1.0 is here
authors: [michaelbromley, dlhck, naorpeled]
tags: [release, announcement]
description: TypeORM 1.0 drops long-deprecated APIs, modernizes the platform baseline, and lands dozens of fixes and features from the 0.3.x cycle. Here's what shipped, what broke on purpose, and how to get there.
---

TypeORM 1.0 is out.

It has been a long road to this one. TypeORM has been around since 2016; 0.3 shipped in 2021. We have spent the almost five years since that last major fixing bugs, adding drivers, and - as [we wrote last year](/blog/future-of-typeorm) - transitioning the project to a new maintainer team. v1.0 is where we pull it all together: no more "still on 0.3.x" caveats, no more long-deprecated APIs shadowing the supported ones, and a platform baseline that actually matches the Node.js runtime most of our users are on.

This post walks through what changed, what broke on purpose, and how to get your codebase across.

<!-- truncate -->

## By the numbers

From 0.3.28 to 1.0:

- **302 commits** in the v1 development cycle
- **40 contributors**
- **4M+ weekly downloads** on npm
- **36,400+ GitHub stars**
- **10 supported databases**, from Postgres to Spanner to MongoDB

TypeORM sits in the npm top 0.1% by downloads. Every one of those numbers is why v1 had to be done carefully. We did not want to be the team that broke everyone's Monday morning.

## The rename you have been waiting (or dreading) for

`Connection` is now `DataSource`. This is the single biggest change in v1, and we held it back for a major version specifically so we could do it right.

Before:

```typescript
import { Connection, createConnection } from "typeorm"

const connection = await createConnection({
    type: "postgres",
    host: "localhost",
})

if (connection.isConnected) {
    // ...
}

await connection.close()
```

After:

```typescript
import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "postgres",
    host: "localhost",
})

await dataSource.initialize()

if (dataSource.isInitialized) {
    // ...
}

await dataSource.destroy()
```

The old naming conflated the transport connection with the higher-level persistence context. `DataSource` is what the object actually is - a configured source of data along with its repositories, its metadata, and its migration runner. It is also how the rest of the Node ecosystem names this thing.

The rename cascades:

- `Connection` class → `DataSource`
- `ConnectionOptions` → `DataSourceOptions`
- `.connection` property → `.dataSource` everywhere
- `createConnection()`, `getConnection()`, `getRepository()`, `getManager()`, `getTreeRepository()`, `getMongoRepository()`, `ConnectionManager` - all gone. Go through your `DataSource` instance instead.

## Find options are object-shaped now

No more string arrays for `relations` or `select`:

```typescript
// before
{
  relations: ["profile", "posts"],
  select: ["id", "name"],
}

// after
{
  relations: { profile: true, posts: true },
  select: { id: true, name: true },
}
```

Better typing, better IDE completion, one canonical shape. The `join` option on find is gone too - the QueryBuilder is still there for complex joins.

We also collapsed three near-duplicate methods down to one idiomatic way each:

- `findOneById(1)` → `findOneBy({ id: 1 })`
- `findByIds([1, 2, 3])` → `findBy({ id: In([1, 2, 3]) })`
- `exist(...)` → `exists(...)`

## What is new

Beyond the cleanup, v1 ships a pile of features that were sitting in the 0.3 pipeline waiting for a major to land.

**QueryBuilder**

- `valuesFromSelect()` - real `INSERT … SELECT` in the builder, for bulk data moves you used to have to drop into raw SQL for.
- `.returning()` on `update()` and `upsert()` where the database supports it, so you do not need a follow-up SELECT.
- `ifExists` on `dropTable`, `dropDatabase`, and `dropIndex` - idempotent teardown without try/catch scaffolding.

**Transactions**

- A DataSource-level `isolationLevel` that every driver honors by default, including Aurora Postgres and Google Spanner.

**PostgreSQL**

- Partial indexes via `@Index({ where: "..." })`.
- Automatic extension installation at sync time: `installExtensions: ["uuid-ossp", "postgis"]`.
- Simpler enum modifications - `ALTER TYPE … ADD VALUE` where previously we had to swap types through a migration dance.

**SQLite**

- `jsonb` column type.
- Encryption key support on React Native.

**Resource safety**

- `await using` on `QueryRunner`. The runner releases itself when the block exits. One fewer class of leaked-connection bugs.

**Type safety**

- `increment()` and `decrement()` are now aware of your entity's columns. Typos get caught at compile time.

And dozens of fixes across query generation, eager loading, soft delete, tree entities, and every driver. Full list in the [upgrading guide](/docs/releases/1.0/upgrading-from-0.3).

## What we removed, and what is required

v1 has a sharper minimum bar than 0.3. That is intentional.

- **Node.js 20+**
- **ES2023** target
- **`mysql2`** only (the old `mysql` driver is gone)
- **`better-sqlite3`** only (`sqlite3` is gone)
- **MongoDB driver v7+**
- **Expo SDK v52+**

Other removals worth calling out:

- `@EntityRepository`, `AbstractRepository`, and `getCustomRepository()` - use `Repository.extend()`.
- `@RelationCount` - use `@VirtualColumn` with a subquery.
- The IoC container integration - get repositories from your `DataSource`.
- `TYPEORM_*` environment variable auto-loading and auto-`dotenv`. Load your env the same way the rest of your app does.

One behavioral change that will surprise people if they are not expecting it: passing `null` or `undefined` in a `where` clause now throws. The 0.3.x behavior was to silently ignore those values, which was correct about half the time and produced extremely surprising queries the other half.

```typescript
// throws in v1
await repository.find({ where: { text: null } })

// do this instead
import { IsNull } from "typeorm"
await repository.find({ where: { text: IsNull() } })
```

You can opt back into the old behavior with `invalidWhereValuesBehavior: "ignore"` on your `DataSourceOptions` if you really need to. We do not recommend it.

There is also one quiet but important SQL change: relations declared with `nullable: false` now compile to `INNER JOIN` instead of `LEFT JOIN`. If your database has rows that violate your own `NOT NULL` constraints, those rows will silently drop out of query results. Check your data before you ship.

## Upgrading

We shipped a codemod:

```bash
npx @typeorm/codemod v1 src/
```

It handles the rename-heavy work automatically: imports, method names, find-option syntax, dependency pins. For most codebases it does about 80% of the upgrade.

What it cannot do for you:

- **Verify data integrity.** The INNER JOIN change above needs human eyes and a quick audit query per relation.
- **Audit `null`-in-where call sites.** The error at runtime is clear, but it is easier to find them ahead of time than in production.
- **Update NestJS.** Bump `@nestjs/typeorm` to v10+ alongside TypeORM.

The full upgrade walkthrough, with every change and every before/after, is in the [upgrading guide](/docs/releases/1.0/upgrading-from-0.3).

## Thank you

v1 exists because 40 people shipped PRs in this cycle, because a steady stream of bug reports and reproductions kept us honest, and because sponsors on OpenCollective kept the lights on long enough to get here.

Special thanks to **Umed Khudoiberdiev** ([@pleerock](https://github.com/pleerock)) and **Dmitry Zotov** - TypeORM is their project originally. v1 is built on top of everything they shipped across the entire 0.x series. Thank you for trusting us to carry this forward.

Thanks to the current maintainer team carrying v1 over the line:

- **Michael Bromley** ([@michaelbromley](https://github.com/michaelbromley)) and **David Höck** ([@dlhck](https://github.com/dlhck)) on the steering committee, leading the transition we [announced last year](/blog/future-of-typeorm)
- **Lucian Mocanu** ([@alumni](https://github.com/alumni)) as technical lead
- Maintainers: **Naor Peled** ([@naorpeled](https://github.com/naorpeled)), **Giorgio Boa** ([@gioboa](https://github.com/gioboa)), **Piotr Kuczynski** ([@pkuczynski](https://github.com/pkuczynski)), **Mohammed Gomaa** ([@G0maa](https://github.com/G0maa)), **Julian Pufler** ([@pujux](https://github.com/pujux)), **Simon Garner** ([@sgarner](https://github.com/sgarner)), **Pieter Wigboldus** ([@w3nl](https://github.com/w3nl)), and **Mike Guida** ([@mguida22](https://github.com/mguida22))

And everyone pitching in from the Working Group.

And to the 40+ contributors whose code is in this release: thank you. If your handle is in the CHANGELOG, something you wrote is running in production at thousands of companies by tomorrow morning.

If your company uses TypeORM and has never sponsored, this is a good time: [opencollective.com/typeorm](https://opencollective.com/typeorm). The path to the non-profit foundation we described last year is staffed by your sponsorship.

## Links

- [Upgrading from 0.3](/docs/releases/1.0/upgrading-from-0.3) - breaking changes, new features, and the full migration walkthrough
- [`@typeorm/codemod`](https://www.npmjs.com/package/@typeorm/codemod)
- [GitHub](https://github.com/typeorm/typeorm)
- [OpenCollective](https://opencollective.com/typeorm)
- [The Future of TypeORM (Oct 2024)](/blog/future-of-typeorm) - if you missed the governance announcement
