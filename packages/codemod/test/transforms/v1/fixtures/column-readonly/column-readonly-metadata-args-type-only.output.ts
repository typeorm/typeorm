import type { ColumnMetadata } from "typeorm"

// Type-only `ColumnMetadata` import does not create a runtime binding.
// The `new ColumnMetadata(...)` in this file refers to a user's own
// runtime class (declared below), so the rewrite must NOT fire here.
type _Unused = ColumnMetadata

declare class ColumnMetadata2 {
    constructor(_opts: { args: { options: { readonly: boolean } } }) {}
}
const a = new ColumnMetadata2({
    args: { options: { readonly: true } },
})
