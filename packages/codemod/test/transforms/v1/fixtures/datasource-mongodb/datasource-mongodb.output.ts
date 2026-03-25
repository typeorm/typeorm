import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "mongodb",
    tls: true,
    appName: "myapp",
})
