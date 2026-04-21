// Barrel files that only re-export TypeORM APIs (no `import` statements
// at all) still need the Connection → DataSource rewrite. Without the
// re-export check in `fileImportsFrom`, this file would be skipped.
// `export * from "typeorm/.../ConnectionOptions"` must also have its
// source path rewritten alongside named-re-export sources.
export { Connection, ConnectionOptions } from "typeorm"
export { Connection as LegacyConn } from "typeorm"
export * from "typeorm/connection/ConnectionOptions"
export * from "typeorm/driver/sap/SapDataSourceOptions"
