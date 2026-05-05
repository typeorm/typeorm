import * as typeorm from "typeorm"

// Top-level namespace import is the real TypeORM `typeorm` — rewrite fires.
const top = new typeorm.ColumnMetadata({
    args: { options: { update: false } },
})

// Catch-clause binding re-declares `typeorm` inside the handler. The scope
// guard must reject the namespace-qualified call — the inner
// `new typeorm.ColumnMetadata(...)` refers to the caught value, not the import.
function handle() {
    try {
        throw new Error("boom")
    } catch (typeorm: any) {
        return new typeorm.ColumnMetadata({
            args: { options: { readonly: true } },
        })
    }
}

// Nested class declaration shadows the `typeorm` namespace inside the
// function body. Rewrite must NOT fire.
function buildFromClass() {
    class typeorm {
        static ColumnMetadata = class {
            constructor(_opts: { args: { options: { readonly: boolean } } }) {}
        }
    }
    return new typeorm.ColumnMetadata({
        args: { options: { readonly: true } },
    })
}

export { top, handle, buildFromClass }
