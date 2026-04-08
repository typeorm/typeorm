import React from "react"
import type { PropsWithChildren } from "react"
import Tabs from "@theme/Tabs"
import TabItem from "@theme/TabItem"

const databases = {
    cockroachdb: { label: "CockroachDB", icon: "/img/databases/cockroachdb.svg" },
    spanner: { label: "Google Spanner", icon: "/img/databases/spanner.svg" },
    mariadb: { label: "MariaDB", icon: "/img/databases/mariadb.svg" },
    mongodb: { label: "MongoDB", icon: "/img/databases/mongodb.svg" },
    mysql: { label: "MySQL", icon: "/img/databases/mysql.svg" },
    oracle: { label: "Oracle", icon: "/img/databases/oracle.svg" },
    postgres: { label: "PostgreSQL", icon: "/img/databases/postgresql.svg" },
    sap: { label: "SAP HANA", icon: "/img/databases/sap.svg" },
    mssql: { label: "SQL Server", icon: "/img/databases/mssql.svg" },
    sqlite: { label: "SQLite", icon: "/img/databases/sqlite.svg" },
} as const

type DatabaseName = keyof typeof databases

export const DatabaseTabs = ({ children }: PropsWithChildren) => {
    const tabs = React.Children.toArray(children)
        .filter(React.isValidElement)
        .map((child: React.ReactElement<{ value: string }>) => {
            const value = child.props.value as DatabaseName
            const db = databases[value]
            if (!db) {
                throw new Error(
                    `<DatabaseTabs>: unknown database "${value}". ` +
                    `Valid values: ${Object.keys(databases).join(", ")}`,
                )
            }
            return {
                value,
                label: (
                    <img
                        src={db.icon}
                        alt={db.label}
                        aria-label={db.label}
                        width={40}
                        height={40}
                        style={{ verticalAlign: "middle" }}
                    />
                ),
            }
        })

    return (
        <Tabs
            groupId="database"
            queryString
            values={tabs}
        >
            {children}
        </Tabs>
    )
}

export { TabItem as DatabaseTab }
