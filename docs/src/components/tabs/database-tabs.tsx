import React from "react"
import type { PropsWithChildren } from "react"
import Tabs from "@theme/Tabs"
import TabItem from "@theme/TabItem"

const databases = {
    cockroachdb: { label: "CockroachDB", icon: "/img/databases/cockroachdb.png" },
    spanner: { label: "Google Spanner", icon: "/img/databases/spanner.svg" },
    mariadb: { label: "MariaDB", icon: "/img/databases/mariadb.png" },
    mongodb: { label: "MongoDB", icon: "/img/databases/mongodb.png" },
    mysql: { label: "MySQL", icon: "/img/databases/mysql.png" },
    oracle: { label: "Oracle", icon: "/img/databases/oracle.png" },
    postgres: { label: "PostgreSQL", icon: "/img/databases/postgresql.png" },
    sap: { label: "SAP HANA", icon: "/img/databases/sap.png" },
    mssql: { label: "SQL Server", icon: "/img/databases/mssql.png" },
    sqlite: { label: "SQLite", icon: "/img/databases/sqlite.png" },
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
                        width={20}
                        height={20}
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
