const dataSource = new DataSource({
    type: "better-sqlite3",
    database: "db.sqlite",
    busyTimeout: 2000,
    flags: ["OPEN_URI"],
})
