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

// Unrelated objects in the same file must NOT be mutated — the scope guard
// requires a sibling `type: "mongodb"` before renaming/removing keys.
const postgresConfig = {
    type: "postgres",
    ssl: true,
    keepAlive: true,
    appname: "postgres-service",
}
const fetchOptions = { keepAlive: true, ssl: false }
const writeConcernCollision = { j: [1, 2, 3], w: "other" }
