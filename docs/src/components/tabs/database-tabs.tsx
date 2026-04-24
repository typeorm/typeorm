import React from "react"
import type { PropsWithChildren, ReactNode } from "react"
import Tabs from "@theme/Tabs"
import TabItem from "@theme/TabItem"
import { databases, type DatabaseName } from "@site/src/constants/databases"

type DatabaseTabProps = PropsWithChildren<{
    value: DatabaseName
}>

// Marker component: only used to declare DatabaseTabs children in MDX; its
// `value` and `children` props are consumed by DatabaseTabs, so it is never
// rendered on its own.
export const DatabaseTab = (_: DatabaseTabProps): null => null

export const DatabaseTabs = ({ children }: PropsWithChildren) => {
    const seen = new Set<DatabaseName>()
    const entries = React.Children.toArray(children).map((child, index) => {
        if (!React.isValidElement(child) || child.type !== DatabaseTab) {
            throw new Error(
                `<DatabaseTabs>: child at position ${index} is not a <DatabaseTab>. Only <DatabaseTab value="…"> children are allowed.`,
            )
        }

        const { value, children: content } = child.props
        const db = databases[value]

        if (!db) {
            throw new Error(
                `<DatabaseTabs>: unknown database "${value}". Valid values: ${Object.keys(databases).join(", ")}`,
            )
        }

        if (seen.has(value)) {
            throw new Error(
                `<DatabaseTabs>: duplicate <DatabaseTab value="${value}">.`,
            )
        }

        seen.add(value)

        return { value, db, content }
    })

    const order = Object.keys(databases)
    entries.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value))

    const values = entries.map(({ value, db }) => ({
        value,
        label: (
            <img
                src={db.icon}
                alt={db.label}
                title={db.label}
                aria-label={db.label}
                width={40}
                height={40}
                style={{ verticalAlign: "middle" }}
            />
        ),
    }))

    return (
        <Tabs groupId="database" queryString values={values}>
            {entries.map(({ value, db, content }) => (
                <TabItem key={value} value={value}>
                    <h3>{db.label}</h3>
                    {content}
                </TabItem>
            ))}
        </Tabs>
    )
}
