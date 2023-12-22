export type IsolationLevel =
    | "READ UNCOMMITTED"
    | "READ COMMITTED"
    | "REPEATABLE READ"
    | "SERIALIZABLE"
    | "ONLINE READ ONLY" // YDB
    | "STALE READ ONLY" // YDB
    | "SNAPSHOT READ ONLY" // YDB
