import { DataSource, createConnection } from "typeorm"

const dataSource = new DataSource({
    name: "default",
    type: "postgres",
    database: "test",
})

// `createConnection({ name })` — the `name` option is removed too,
// alongside the existing `new DataSource` case. Works because the
// `datasource-name` transform runs before `global-functions` strips
// the `createConnection` import.
const conn = await createConnection({
    name: "default",
    type: "postgres",
    database: "test",
})

// Should NOT be transformed — not a DataSource config
const customField = { name: "message", type: "string" }
const asset = { name: "photo.jpg", type: "IMAGE" }
