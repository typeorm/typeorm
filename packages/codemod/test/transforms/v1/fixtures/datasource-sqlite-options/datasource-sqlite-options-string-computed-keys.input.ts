import { DataSource } from "typeorm"

// Constant computed-string keys like `["busyTimeout"]: …` are statically
// knowable and must be rewritten the same way as plain identifier keys. The
// replacement is emitted as a non-computed identifier key.
const dataSource = new DataSource({
    ["type"]: "better-sqlite3",
    ["database"]: "db.sqlite",
    ["busyTimeout"]: 2000,
    ["flags"]: ["OPEN_URI"],
})
