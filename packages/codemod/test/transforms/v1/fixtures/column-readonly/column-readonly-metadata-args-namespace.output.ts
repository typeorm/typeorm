import * as typeorm from "typeorm"

declare const metadata: any

// Namespace import: `new typeorm.ColumnMetadata(...)` must be matched the same
// as a direct `new ColumnMetadata(...)`, so the nested `readonly` → `update`
// rename fires regardless of import style.
const col = new typeorm.ColumnMetadata({
    entityMetadata: metadata,
    args: {
        target: "A",
        mode: "regular",
        propertyName: "a",
        options: {
            type: "varchar",
            update: false,
        },
    },
})

// Control: different class on the same namespace is not touched.
declare class ColumnMetadata2 {
    constructor(_opts: { args: { options: { readonly: boolean } } }) {}
}
const other = new ColumnMetadata2({ args: { options: { readonly: true } } })
