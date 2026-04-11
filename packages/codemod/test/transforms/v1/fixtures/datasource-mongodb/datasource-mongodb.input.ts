import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "mongodb",
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ssl: true,
    appname: "myapp",
})
