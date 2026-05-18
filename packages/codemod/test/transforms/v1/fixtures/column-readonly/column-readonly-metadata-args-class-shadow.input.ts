import { ColumnMetadata } from "typeorm"

// Top-level import is the real `ColumnMetadata` — rewrite fires here.
const top = new ColumnMetadata({
    args: { options: { readonly: true } },
})

// Nested class declaration shadows the import inside the function body.
// The `new ColumnMetadata(...)` below resolves to the local class, not the
// import, so the scope guard must reject this call.
function buildFromClass() {
    class ColumnMetadata {
        constructor(_opts: { args: { options: { readonly: boolean } } }) {}
    }
    return new ColumnMetadata({
        args: { options: { readonly: true } },
    })
}

export { top, buildFromClass }
