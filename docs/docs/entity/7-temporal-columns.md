# Temporal columns (Postgres)

TypeORM supports the [TC39 Temporal proposal](https://github.com/tc39/proposal-temporal)
as an opt-in alternative to JavaScript `Date` for date/time columns on PostgreSQL.

## Requirements

- Node.js 26 or newer (or any runtime that exposes `globalThis.Temporal`).
- PostgreSQL driver. Other drivers will follow in subsequent releases.

If `globalThis.Temporal` is not available, TypeORM will throw a fail-fast error
during DataSource initialisation when any entity has a `temporal` column.

## Enabling per column

```ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Event {
    @PrimaryGeneratedColumn() id!: number

    @Column({
        type: "timestamptz",
        temporal: { timeZone: "Asia/Seoul" },
    })
    scheduledAt!: Temporal.ZonedDateTime

    @Column({ type: "date", temporal: true })
    onDate!: Temporal.PlainDate

    @Column({ type: "interval", temporal: true })
    duration!: Temporal.Duration
}
```

## SQL type → Temporal kind

| SQL           | Temporal                                 |
| ------------- | ---------------------------------------- |
| `date`        | `Temporal.PlainDate`                     |
| `time`        | `Temporal.PlainTime`                     |
| `timestamp`   | `Temporal.PlainDateTime`                 |
| `timestamptz` | `Temporal.ZonedDateTime` (timeZone 필수) |
| `interval`    | `Temporal.Duration`                      |

`timestamptz` columns require an explicit IANA timezone — there is no
`temporal: true` shortcut. The column hydrates as `Temporal.ZonedDateTime`
in the configured zone.

```ts
@Column({
    type: "timestamptz",
    temporal: { timeZone: "Asia/Seoul" },
})
scheduledAt!: Temporal.ZonedDateTime
```

## SQL type inference from reflect-metadata

If TypeScript emits `design:type` reflect-metadata and the property type is a
`Temporal.*` class, TypeORM infers a sensible default SQL type — but Temporal
hydration itself is still opt-in via `temporal`. This keeps the opt-in switch
explicit and orthogonal to type inference.

```ts
@Entity()
export class Event {
    @PrimaryGeneratedColumn() id!: number

    // SQL type inferred as `timestamp`. Add `temporal: true` to hydrate as
    // Temporal.PlainDateTime instead of Date.
    @Column({ temporal: true })
    happenedAt!: Temporal.PlainDateTime

    @Column({ temporal: true })
    onDate!: Temporal.PlainDate
}
```

## Limitations

- `time with time zone` (`timetz`) has no direct Temporal counterpart and is
  rejected at metadata build time.
- `Temporal.ZonedDateTime` requires an explicit `timeZone` — it is not auto-inferred.
- Only PostgreSQL is supported in this release. MySQL, SQLite, MSSQL, Oracle,
  SAP HANA, CockroachDB, and MongoDB tracking is in separate work.
- QueryBuilder comparison helpers (`Between`, `MoreThan`, etc.) do not yet
  accept Temporal values directly; bind them as parameters.

## Migration from `Date`

Existing columns that use `Date` continue to work without changes. To move a
specific column to Temporal:

```ts
// Before
@Column({ type: "timestamptz" })
createdAt!: Date

// After
@Column({
    type: "timestamptz",
    temporal: { timeZone: "UTC" },
})
createdAt!: Temporal.ZonedDateTime
```

The underlying SQL type (`timestamptz`) does not change, so no schema
migration is required.
