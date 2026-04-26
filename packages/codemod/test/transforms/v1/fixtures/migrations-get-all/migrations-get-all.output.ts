// TODO(typeorm-v1): `getAllMigrations()` was removed — use `getPendingMigrations()`, `getExecutedMigrations()`, or `dataSource.migrations` instead
await migrationExecutor.getAllMigrations()

// TODO(typeorm-v1): `getAllMigrations()` was removed — use `getPendingMigrations()`, `getExecutedMigrations()`, or `dataSource.migrations` instead
const migrations = await migrationExecutor.getAllMigrations()

await migrationExecutor.getPendingMigrations()
