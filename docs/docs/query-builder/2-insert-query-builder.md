# Insert using Query Builder

You can create `INSERT` queries using `QueryBuilder`.
Examples:

```typescript
await dataSource
    .createQueryBuilder()
    .insert()
    .into(User)
    .values([
        { firstName: "Timber", lastName: "Saw" },
        { firstName: "Phantom", lastName: "Lancer" },
    ])
    .execute()
```

This is the most efficient way in terms of performance to insert rows into your database.
You can also perform bulk insertions this way.

## Raw SQL support

In some cases when you need to execute SQL queries you need to use function style value:

```typescript
await dataSource
    .createQueryBuilder()
    .insert()
    .into(User)
    .values({
        firstName: "Timber",
        lastName: () => "CONCAT('S', 'A', 'W')",
    })
    .execute()
```

> Warning: When using raw SQL, ensure that values are properly sanitized to prevent SQL injection.

## Update values ON CONFLICT

If the values you are trying to insert conflict due to existing data the `orUpdate` function can be used to update specific values on the conflicted target.

```typescript
await dataSource
    .createQueryBuilder()
    .insert()
    .into(User)
    .values({
        firstName: "Timber",
        lastName: "Saw",
        externalId: "abc123",
    })
    .orUpdate(["firstName", "lastName"], ["externalId"])
    .execute()
```

## Update values ON CONFLICT with condition (Postgres, Oracle, MSSQL, SAP HANA)

```typescript
await dataSource
    .createQueryBuilder()
    .insert()
    .into(User)
    .values({
        firstName: "Timber",
        lastName: "Saw",
        externalId: "abc123",
    })
    .orUpdate(["firstName", "lastName"], ["externalId"], {
        overwriteCondition: {
            where: {
                firstName: Equal("Phantom"),
            },
        },
    })
    .execute()
```

## IGNORE error (MySQL) or DO NOTHING (Postgres, Oracle, MSSQL, SAP HANA) during insert

If the values you are trying to insert conflict due to existing data or containing invalid data, the `orIgnore` function can be used to suppress errors and insert only rows that contain valid data.

```typescript
await dataSource
    .createQueryBuilder()
    .insert()
    .into(User)
    .values({
        firstName: "Timber",
        lastName: "Saw",
        externalId: "abc123",
    })
    .orIgnore()
    .execute()
```

## Skip data update if values have not changed (Postgres, Oracle, MSSQL, SAP HANA)

```typescript
await dataSource
    .createQueryBuilder()
    .insert()
    .into(User)
    .values({
        firstName: "Timber",
        lastName: "Saw",
        externalId: "abc123",
    })
    .orUpdate(["firstName", "lastName"], ["externalId"], {
        skipUpdateIfNoValuesChanged: true,
    })
    .execute()
```

## Use partial index (Postgres)

```typescript
await dataSource
    .createQueryBuilder()
    .insert()
    .into(User)
    .values({
        firstName: "Timber",
        lastName: "Saw",
        externalId: "abc123",
    })
    .orUpdate(["firstName", "lastName"], ["externalId"], {
        skipUpdateIfNoValuesChanged: true,
        indexPredicate: "date > 2020-01-01",
    })
    .execute()
```

## Insert from Select

You can insert data from one table into another using a `SELECT` query with the `valuesFromSelect()` method. This creates an `INSERT INTO ... SELECT FROM` statement, which is useful for data migration, archiving, or copying data between tables.

### Using a SelectQueryBuilder directly

```typescript
// Create a select query to get the source data
const selectQuery = dataSource
    .createQueryBuilder()
    .select(["user.firstName", "user.lastName"])
    .from(User, "user")
    .where("user.isActive = :isActive", { isActive: true })

// Insert the selected data into another table
await dataSource
    .createQueryBuilder()
    .insert()
    .into(ArchivedUser, ["firstName", "lastName"])
    .valuesFromSelect(selectQuery)
    .execute()
```

### Using a callback function

You can also use a callback function to build the select query:

```typescript
await dataSource
    .createQueryBuilder()
    .insert()
    .into(ArchivedUser, ["firstName", "lastName", "archivedAt"])
    .valuesFromSelect((qb) =>
        qb
            .select(["user.firstName", "user.lastName", "NOW()"])
            .from(User, "user")
            .where("user.deletedAt IS NOT NULL"),
    )
    .execute()
```

### With joins

You can use joins in the select query to combine data from multiple tables:

```typescript
await dataSource
    .createQueryBuilder()
    .insert()
    .into(UserReport, ["userName", "orderCount"])
    .valuesFromSelect((qb) =>
        qb
            .select(["user.name", "COUNT(order.id)"])
            .from(User, "user")
            .leftJoin("user.orders", "order")
            .groupBy("user.id"),
    )
    .execute()
```

> **Note:** When using `valuesFromSelect()`, entity listeners and subscribers (`@BeforeInsert`, `@AfterInsert`) are not called because no entity instances are created during the insert operation.

> **Note:** The `updateEntity` option has no effect with `valuesFromSelect()` since there are no entity instances to update.
