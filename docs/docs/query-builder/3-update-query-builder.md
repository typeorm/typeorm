# Update using Query Builder

You can create `UPDATE` queries using `QueryBuilder`.
Examples:

```typescript
await dataSource
    .createQueryBuilder()
    .update(User)
    .set({ firstName: "Timber", lastName: "Saw" })
    .where("id = :id", { id: 1 })
    .execute()
```

This is the most efficient way in terms of performance to update entities in your database.

## Raw SQL support

In some cases when you need to execute SQL queries you need to use function style value:

```typescript
await dataSource
    .createQueryBuilder()
    .update(User)
    .set({
        firstName: "Timber",
        lastName: "Saw",
        age: () => "age + 1",
    })
    .where("id = :id", { id: 1 })
    .execute()
```

> Warning: When using raw SQL, ensure that values are properly sanitized to prevent SQL injection.

## UPDATE FROM syntax

Some databases support `UPDATE ... FROM` syntax which allows you to update a table based on data from other tables. TypeORM provides the `from()` and `addFrom()` methods for this purpose.

### Supported databases

The following database drivers support `UPDATE ... FROM` syntax:

- **PostgreSQL** and **Aurora PostgreSQL**
- **SQL Server**
- **SQLite** (requires SQLite engine version 3.33.0 or newer; `better-sqlite3` driver ships with a compatible version)
- **CockroachDB**

### Using from() and addFrom()

The `from()` method specifies additional tables to include in the `UPDATE ... FROM` clause. The `addFrom()` method is an alias for `from()`.

```typescript
// Update users based on their profile data
await dataSource
    .createQueryBuilder()
    .update(User)
    .set({ status: "active" })
    .from(Profile, "profile")
    .where("user.profileId = profile.id")
    .andWhere("profile.verified = :verified", { verified: true })
    .execute()
```

### Error handling

If you attempt to use `from()` or `addFrom()` on a database that doesn't support `UPDATE ... FROM` syntax, TypeORM will throw a `FromOnUpdateNotSupportedError`.

```typescript
try {
    await dataSource
        .createQueryBuilder()
        .update(User)
        .set({ status: "active" })
        .from(Profile, "profile")
        .where("user.profileId = profile.id")
        .execute()
} catch (error) {
    if (error instanceof FromOnUpdateNotSupportedError) {
        console.log("This database doesn't support UPDATE ... FROM syntax")
    }
}
```

### Driver capability check

You can check if a driver supports `UPDATE ... FROM` syntax using the `isUpdateFromSqlSupported()` method:

```typescript
const driver = dataSource.driver
if (driver.isUpdateFromSqlSupported()) {
    // Safe to use from() and addFrom()
} else {
    // Use alternative update approach
}
```
