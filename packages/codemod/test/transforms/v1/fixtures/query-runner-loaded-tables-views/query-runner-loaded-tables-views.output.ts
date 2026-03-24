// TODO: `loadedTables` was removed in TypeORM v1. Use async `loadTables()` / `loadViews()` methods instead. See migration guide: https://typeorm.io/docs/guides/migration-v1
const tables = queryRunner.loadedTables
// TODO: `loadedViews` was removed in TypeORM v1. Use async `loadTables()` / `loadViews()` methods instead. See migration guide: https://typeorm.io/docs/guides/migration-v1
const views = queryRunner.loadedViews
