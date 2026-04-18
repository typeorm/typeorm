import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "mongodb",
    useNewUrlParser: true,
    useUnifiedTopology: true,
    keepAlive: true,
    ssl: true,
    sslCA: "./ca.pem",
    sslPass: "secret",
    sslValidate: true,
    w: "majority",
    wtimeoutMS: 5000,
    appname: "myapp",
    123: "noop",
})

// Boolean literal false → inverted to true (no TODO needed)
const ds2 = new DataSource({
    type: "mongodb",
    sslValidate: false,
})

// Non-literal value → keep value, emit TODO
declare const validate: boolean
const ds3 = new DataSource({
    type: "mongodb",
    sslValidate: validate,
})
