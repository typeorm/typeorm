export type IsolationLevel =
    | "READ UNCOMMITTED"
    | "READ COMMITTED"
    | "REPEATABLE READ"
    | "SERIALIZABLE"
    | "SNAPSHOT" // SQL Server specific isolation level
