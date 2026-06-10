import { ColumnMetadata } from "typeorm"

declare const metadata: any

// `new ColumnMetadata({ args: { options: {...} } })` — the nested `options`
// object is typed `ColumnOptions`, which no longer has `width` or `zerofill`
// in v1. Both must be stripped here just as they are on the `@Column` decorator.
const col = new ColumnMetadata({
    entityMetadata: metadata,
    args: {
        target: "A",
        mode: "regular",
        propertyName: "a",
        options: {
            type: "int",
            nullable: false,
        },
    },
})

// Control: unrelated constructor of same name — must not be touched.
class ColumnMetadata2 {
    constructor(_opts: { args: { options: { width: number } } }) {}
}
const custom = new ColumnMetadata2({
    args: { options: { width: 5 } },
})
