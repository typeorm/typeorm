import { ColumnMetadata } from "typeorm"

declare const metadata: any

// JavaScript object literals resolve duplicate keys by the last occurrence —
// `{ options: A, options: B }` evaluates to `options === B`. The rewrite must
// target the effective (last) occurrence so the migrated runtime behavior
// matches the original.
const col = new ColumnMetadata({
    entityMetadata: metadata,
    args: {
        target: "A",
        mode: "regular",
        propertyName: "a",
        options: {
            type: "int",
            width: 10,
            zerofill: true,
        },
        options: {
            type: "bigint",
        },
    },
})
