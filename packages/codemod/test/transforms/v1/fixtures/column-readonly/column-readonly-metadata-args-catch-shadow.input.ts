import { ColumnMetadata } from "typeorm"

// Top-level import is the real `ColumnMetadata` — rewrite fires here.
const top = new ColumnMetadata({
    args: { options: { readonly: true } },
})

// Catch-clause binding re-declares `ColumnMetadata`. The catch scope is
// narrower than the enclosing function and still lives below the module
// scope, so the scope guard must reject this call — the inner
// `new ColumnMetadata(...)` refers to the caught value, not the import.
function handle() {
    try {
        throw new Error("boom")
    } catch (ColumnMetadata: any) {
        return new ColumnMetadata({
            args: { options: { readonly: true } },
        })
    }
}

export { top, handle }
