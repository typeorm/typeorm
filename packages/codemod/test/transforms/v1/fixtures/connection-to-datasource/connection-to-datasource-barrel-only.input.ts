// Barrel files that only re-export TypeORM APIs (no `import` statements
// at all) still need the Connection → DataSource rewrite. Without the
// re-export check in `fileImportsFrom`, this file would be skipped.
export { Connection, ConnectionOptions } from "typeorm"
export { Connection as LegacyConn } from "typeorm"
export * from "typeorm/driver/sap/SapDataSourceOptions"
