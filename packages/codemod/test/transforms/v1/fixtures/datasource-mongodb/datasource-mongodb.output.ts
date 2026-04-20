import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "mongodb",
    tls: true,
    tlsCAFile: "./ca.pem",
    tlsCertificateKeyFilePassword: "secret",
    tlsAllowInvalidCertificates: false,

    // TODO(typeorm-v1): `w` was removed — migrate to `writeConcern: { ... }`
    w: "majority",

    // TODO(typeorm-v1): `wtimeoutMS` was removed — migrate to `writeConcern: { ... }`
    wtimeoutMS: 5000,

    appName: "myapp",
    123: "noop",
})

// Boolean literal false → inverted to true (no TODO needed)
const ds2 = new DataSource({
    type: "mongodb",
    tlsAllowInvalidCertificates: true,
})

// Non-literal value → keep value, emit TODO
declare const validate: boolean
const ds3 = new DataSource({
    type: "mongodb",
    // TODO(typeorm-v1): `sslValidate` was renamed to `tlsAllowInvalidCertificates` with inverted boolean logic. Review and invert the value.
    tlsAllowInvalidCertificates: validate,
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
