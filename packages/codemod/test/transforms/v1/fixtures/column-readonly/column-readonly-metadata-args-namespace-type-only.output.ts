import type * as typeorm from "typeorm"

declare const metadata: any

// Type-only namespace import does NOT create a runtime `typeorm` binding —
// TypeScript erases `import type` at compile time. The `new typeorm.ColumnMetadata(...)`
// below therefore refers to the user-defined runtime `typeorm` object declared
// below, not the TypeORM package. The rewrite must NOT fire here.
type _Unused = typeorm.ColumnMetadata

declare class ColumnMetadata2 {
    constructor(_opts: { args: { options: { readonly: boolean } } }) {}
}
const runtimeTypeorm = { ColumnMetadata: ColumnMetadata2 }
const col = new runtimeTypeorm.ColumnMetadata({
    args: { options: { readonly: true } },
})
