# LibSQL Example

This example demonstrates how to use TypeORM with LibSQL databases, including local files, remote databases (like Turso), and embedded replicas.

## What is LibSQL?

LibSQL is an open-source SQLite fork that supports:
- Local SQLite-compatible databases
- Remote HTTP-based databases
- Embedded replicas that sync with remote databases

## Installation

To run this example, you need to install the LibSQL client:

```bash
npm install @libsql/client
```

## Configuration Examples

### Local Database

```typescript
const options: DataSourceOptions = {
    type: "libsql",
    url: "file:local.db",
    entities: [Post],
    synchronize: true,
}
```

### Remote Database (Turso)

```typescript
const options: DataSourceOptions = {
    type: "libsql",
    url: "https://your-database-name.turso.io",
    authToken: "your-auth-token",
    entities: [Post],
    synchronize: true,
}
```

### Embedded Replica

```typescript
const options: DataSourceOptions = {
    type: "libsql",
    url: "file:replica.db",
    syncUrl: "https://your-database-name.turso.io",
    authToken: "your-auth-token",
    syncPeriod: 60, // Sync every 60 seconds
    readYourWrites: true,
    entities: [Post],
    synchronize: true,
}
```

## Running the Example

```bash
npm run compile
node build/compiled/sample/sample37-libsql/app.js
```

## Connection Options

The LibSQL driver supports the following options:

- `url`: Database URL (required)
- `authToken`: Authentication token for remote connections
- `database`: Optional database name (derived from URL if not provided)
- `driver`: Custom LibSQL client instance
- `key`: Encryption key for SQLCipher
- `prepareDatabase`: Function to run before using the database
- `enableWAL`: Enable WAL mode for local databases
- `syncUrl`: Sync URL for embedded replicas
- `syncPeriod`: Sync period in seconds for embedded replicas
- `readYourWrites`: Read-your-writes consistency for embedded replicas

## More Information

- [LibSQL Documentation](https://github.com/libsql/libsql)
- [Turso Documentation](https://docs.turso.tech/)
- [TypeORM Documentation](https://typeorm.io/)