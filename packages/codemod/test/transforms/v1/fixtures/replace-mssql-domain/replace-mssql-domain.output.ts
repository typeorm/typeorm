const dataSource = new DataSource({
    type: "mssql",
    // TODO: `domain` was removed in TypeORM v1. Restructure to `authentication: { type: "ntlm", options: { domain: "..." } }`. See migration guide: https://typeorm.io/docs/guides/migration-v1
    domain: "MYDOMAIN",
    username: "user",
})
