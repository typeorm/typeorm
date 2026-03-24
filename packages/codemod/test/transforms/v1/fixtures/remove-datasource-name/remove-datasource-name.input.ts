import { DataSource } from "typeorm"

const dataSource = new DataSource({
    name: "default",
    type: "postgres",
    database: "test",
})

// Should NOT be transformed — not a DataSource config
const customField = { name: "message", type: "string" }
const asset = { name: "photo.jpg", type: "IMAGE" }
