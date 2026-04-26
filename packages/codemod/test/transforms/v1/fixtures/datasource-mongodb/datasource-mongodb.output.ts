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
