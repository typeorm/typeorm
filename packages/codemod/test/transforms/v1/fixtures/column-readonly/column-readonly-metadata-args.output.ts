import { ColumnMetadata } from "typeorm"

declare const metadata: any

// `new ColumnMetadata({ args: { options: {...} } })` — the nested `options`
// object is typed `ColumnOptions`, so the same `readonly` → `update` rename
// that fires on `@Column({...})` must also fire here. Rare in user code but
// shows up in multi-tenant / runtime metadata construction.
const col = new ColumnMetadata({
    entityMetadata: metadata,
    args: {
        target: "A",
        mode: "regular",
        propertyName: "a",
        options: {
            type: "nvarchar",
            name: "A",
            length: 10,
            nullable: true,
            update: true,
            primary: false,
            comment: "A description",
        },
    },
})

// Control: unrelated constructor of same name (user class) must not be
// touched. The scope guard limits the walk to typeorm-imported locals.
class ColumnMetadata2 {
    constructor(_opts: { args: { options: { readonly: boolean } } }) {}
}
const custom = new ColumnMetadata2({ args: { options: { readonly: true } } })
