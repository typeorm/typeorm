# Upgrading to 1.0

This is the migration guide for upgrading from version `0.3.x` to `1.0`.

## General Breaking Changes

...

## SQLite

Drop support to `sqlite3` in favour of `better-sqlite3` as the default driver for `sqlite` databases:

```typescript
new DataSource({
    type: "better-sqlite3", // was "sqlite"
    database: "db.sqlite",
})
```

### `busyTimeout` option renamed to `timeout`

The `sqlite3` package used `busyTimeout` to configure SQLite's busy timeout. `better-sqlite3` uses `timeout` instead (default: 5000ms). Update your DataSource options accordingly:

```typescript
new DataSource({
    type: "better-sqlite3",
    database: "db.sqlite",
    timeout: 2000, // was busyTimeout in sqlite3
})
```

## TODO: add more info after PR is done...
