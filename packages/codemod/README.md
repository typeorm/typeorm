# @typeorm/codemod

Automated code migration tool for TypeORM version upgrades.

## Usage

```bash
# Run all v1 transforms
npx @typeorm/codemod v1 src/

# Dry run (preview changes without writing)
npx @typeorm/codemod v1 --dry src/

# Run a specific transform
npx @typeorm/codemod v1 --transform rename-find-by-ids src/

# List available transforms
npx @typeorm/codemod v1 --list
```

## v0.3.x → v1.0 transforms

| Transform                         | Description                                                                                                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rename-connection-to-datasource` | `Connection` → `DataSource`, `ConnectionOptions` → `DataSourceOptions`, `.connect()` → `.initialize()`, `.close()` → `.destroy()`, `.isConnected` → `.isInitialized` |
| `replace-global-functions`        | `getRepository()`, `createConnection()`, `getManager()`, etc. → `dataSource.*` equivalents                                                                           |
| `rename-find-by-ids`              | `.findByIds([1, 2])` → `.findBy({ id: In([1, 2]) })` (adds `In` import)                                                                                              |
| `rename-exist-to-exists`          | `.exist()` → `.exists()`                                                                                                                                             |
| `rename-print-sql-to-log-query`   | `.printSql()` → `.logQuery()`                                                                                                                                        |
| `rename-get-all-migrations`       | `.getAllMigrations()` → `.getMigrations()`                                                                                                                           |
| `replace-set-native-parameters`   | `.setNativeParameters()` → `.setParameters()`                                                                                                                        |
| `replace-where-expression-type`   | `WhereExpression` → `WhereExpressionBuilder`                                                                                                                         |
| `replace-readonly-column`         | `@Column({ readonly: true })` → `@Column({ update: false })`                                                                                                         |
| `remove-width-zerofill`           | Removes `width` and `zerofill` from `@Column` options                                                                                                                |
| `replace-sqlite-type`             | `type: "sqlite"` → `type: "better-sqlite3"`                                                                                                                          |
| `replace-lock-modes`              | `"pessimistic_partial_write"` → `"pessimistic_write"` + `setOnLocked("skip_locked")`                                                                                 |
| `remove-use-container`            | Removes `useContainer()`/`getFromContainer()` calls and related imports (adds TODO comment)                                                                          |

## After running

Review the changes and look for `TODO` comments — some transforms require manual follow-up:

- `replace-global-functions`: assumes your DataSource variable is named `dataSource`
- `remove-use-container`: leaves TODO comments where manual migration is needed

See the full [Migration Guide](https://typeorm.io/docs/guides/migration-v1) for details on all breaking changes.
