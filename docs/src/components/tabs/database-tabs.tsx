import React from "react"
import type { PropsWithChildren, ReactNode } from "react"
import Tabs from "@theme/Tabs"
import TabItem from "@theme/TabItem"
import {
    databases,
    type DatabaseName,
} from "@site/src/constants/databases"

type DatabaseTabProps = {
    value: DatabaseName
    children: ReactNode
}

// Marker component: only used to declare DatabaseTabs children in MDX; its
// `value` and `children` props are consumed by DatabaseTabs, so it is never
// rendered on its own.
export const DatabaseTab = (_props: DatabaseTabProps): null => null

export const DatabaseTabs = ({ children }: PropsWithChildren) => {
    const entries = React.Children.toArray(children)
        .filter(React.isValidElement)
        .map((child: React.ReactElement<DatabaseTabProps>) => {
            const { value } = child.props
            const db = databases[value]
            if (!db) {
                throw new Error(
                    `<DatabaseTabs>: unknown database "${value}". ` +
                        `Valid values: ${Object.keys(databases).join(", ")}`,
                )
            }
            return { value, db, content: child.props.children }
        })

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
