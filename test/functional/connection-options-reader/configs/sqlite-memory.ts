module.exports = [
    {
        type: "sqlite",
        name: "file",
        database: "test",
    },
    {
        type: "sqlite",
        name: "memory",
        database: ":memory:",
    },
    {
        type: "better-sqlite3",
        name: "memory2",
        database: ":memory:",
    },
    {
        type: "libsql",
        name: "libsql-file",
        database: "test.libsql",
    },
    {
        type: "libsql",
        name: "libsql-memory",
        database: ":memory:",
    },
]
