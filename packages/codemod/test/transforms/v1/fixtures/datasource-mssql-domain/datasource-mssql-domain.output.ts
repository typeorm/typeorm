import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "mssql",
    // TODO(typeorm-v1): `domain` was removed — restructure to `authentication: { type: "ntlm", options: { domain: "..." } }`
    domain: "MYDOMAIN",
    username: "user",
})
