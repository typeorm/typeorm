/**
 * Built-in database types.
 */
export type BuiltInDatabaseType =
    | "mysql"
    | "postgres"
    | "cockroachdb"
    | "sap"
    | "mariadb"
    | "sqlite"
    | "cordova"
    | "react-native"
    | "nativescript"
    | "sqljs"
    | "oracle"
    | "mssql"
    | "mongodb"
    | "aurora-mysql"
    | "aurora-postgres"
    | "better-sqlite3"
    | "capacitor"
    | "cockroachdb"
    | "cordova"
    | "expo"
    | "mariadb"
    | "mongodb"
    | "mssql"
    | "mysql"
    | "nativescript"
    | "oracle"
    | "postgres"
    | "react-native"
    | "sap"
    | "spanner"

/**
 * Database type. Accepts built-in types or any string for custom drivers.
 * Custom drivers must be registered via DriverRegistry.register() before use.
 */
export type DatabaseType = BuiltInDatabaseType | (string & {})
