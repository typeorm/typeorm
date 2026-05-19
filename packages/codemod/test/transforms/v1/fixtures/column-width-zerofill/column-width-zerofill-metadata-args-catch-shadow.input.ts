import { ColumnMetadata } from "typeorm"

// Top-level import is the real `ColumnMetadata` — rewrite fires here.
const top = new ColumnMetadata({
    args: { options: { width: 10, zerofill: true } },
})

// Catch-clause binding re-declares `ColumnMetadata`. The scope guard must
// reject this call — the inner `new ColumnMetadata(...)` refers to the
// caught value, not the import.
function handle() {
    try {
        throw new Error("boom")
    } catch (ColumnMetadata: any) {
        return new ColumnMetadata({
            args: { options: { width: 10, zerofill: true } },
        })
    }
}

export { top, handle }
