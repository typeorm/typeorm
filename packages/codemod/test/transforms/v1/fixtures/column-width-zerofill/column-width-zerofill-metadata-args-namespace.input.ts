import * as typeorm from "typeorm"

declare const metadata: any

// Namespace import: `new typeorm.ColumnMetadata(...)` must be matched the same
// as a direct `new ColumnMetadata(...)`, so `width` and `zerofill` are
// stripped from the options object regardless of import style.
const col = new typeorm.ColumnMetadata({
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
    },
})

// Control: different class on the same namespace is not touched.
declare class ColumnMetadata2 {
    constructor(_opts: {
        args: { options: { width: number; zerofill: boolean } }
    })
}
const other = new ColumnMetadata2({
    args: { options: { width: 10, zerofill: true } },
})
