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

// `type: "mongodb" as const` — scope guard peels TS expression wrappers.
const ds4 = new DataSource({
    type: "mongodb" as const,
    useNewUrlParser: true,
})

// String-literal key (`"type"`) must also match the scope guard —
// Prettier normalizes the surviving quoted key back to identifier form in
// the output, but the transform recognized it during the scope check.
// prettier-ignore
const ds5 = new DataSource({
    "type": "mongodb",
    useNewUrlParser: true,
})
