// The order of entries in this object reflects the order in which
// databases are displayed on the homepage and inside `<DatabaseTabs>`.
export const databases = {
    cockroachdb: {
        label: "CockroachDB",
        icon: "/img/databases/cockroachdb.svg",
    },
    spanner: {
        label: "Google Spanner",
        icon: "/img/databases/spanner.svg",
    },
    mariadb: {
        label: "MariaDB",
        icon: "/img/databases/mariadb.svg",
    },
    mongodb: {
        label: "MongoDB",
        icon: "/img/databases/mongodb.svg",
    },
    mssql: {
        label: "MS SQL Server",
        icon: "/img/databases/mssql.svg",
    },
    mysql: {
        label: "MySQL",
        icon: "/img/databases/mysql.svg",
    },
    oracle: {
        label: "Oracle",
        icon: "/img/databases/oracle.svg",
    },
    postgres: {
        label: "PostgreSQL",
        icon: "/img/databases/postgresql.svg",
    },
    sap: {
        label: "SAP HANA",
        icon: "/img/databases/sap.svg",
    },
    sqlite: {
        label: "SQLite",
        icon: "/img/databases/sqlite.svg",
    },
} as const

export type DatabaseName = keyof typeof databases
