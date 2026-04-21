// Barrel files that only re-export TypeORM APIs (no `import` statements
// at all) still need the Connection → DataSource rewrite. Without the
// re-export check in `fileImportsFrom`, this file would be skipped.
// `export * from "typeorm/.../ConnectionOptions"` must also have its
// source path rewritten alongside named-re-export sources. Bare and
// non-typeorm `export *` sources must be left alone.
export { DataSource, DataSourceOptions } from "typeorm"
export { DataSource as LegacyConn } from "typeorm"
export * from "typeorm/connection/DataSourceOptions"
export * from "typeorm/driver/sap/SapDataSourceOptions"
export * from "typeorm"
export * from "some-other-lib"
