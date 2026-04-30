import type { ColumnMetadata } from "typeorm"

// Type-only import creates no runtime binding. The `const ColumnMetadata`
// below is the user's own value. `valueOnly: true` filters the type-only
// import out of classLocalNames so the rewrite must NOT fire.
type _Unused = ColumnMetadata

const ColumnMetadata = class {
    constructor(_opts: {
        args: { options: { width: number; zerofill: boolean } }
    }) {}
}

const a = new ColumnMetadata({
    args: { options: { width: 10, zerofill: true } },
})

export { a }
