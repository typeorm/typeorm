import { ColumnMetadata } from "typeorm"

// Top-level import is the real TypeORM `ColumnMetadata` — the rewrite
// fires for this call.
const top = new ColumnMetadata({
    args: { options: { update: false } },
})

// `ColumnMetadata` as a function parameter shadows the top-level import
// inside the body. `new ColumnMetadata(...)` refers to the parameter, not
// the import, so the rewrite must NOT fire here.
function buildFromParam(ColumnMetadata: {
    new (opts: { args: { options: { readonly: boolean } } }): unknown
}) {
    return new ColumnMetadata({
        args: { options: { readonly: true } },
    })
}

// Nested `const` that re-binds `ColumnMetadata` in an inner scope.
function buildFromLocal() {
    const ColumnMetadata = class {
        constructor(_opts: { args: { options: { readonly: boolean } } }) {}
    }
    return new ColumnMetadata({
        args: { options: { readonly: true } },
    })
}

export { top, buildFromParam, buildFromLocal }
