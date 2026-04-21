// Barrel files that only re-export TypeORM APIs (no `import` statements
// at all) still need the Connection → DataSource rewrite. Without the
// re-export check in `fileImportsFrom`, this file would be skipped.
export { DataSource, DataSourceOptions } from "typeorm"
export { DataSource as LegacyConn } from "typeorm"
export * from "typeorm/driver/sap/SapConnectionOptions"
