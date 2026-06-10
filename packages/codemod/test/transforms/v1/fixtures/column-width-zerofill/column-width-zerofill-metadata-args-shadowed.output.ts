import { ColumnMetadata } from "typeorm"

// Top-level import is the real TypeORM `ColumnMetadata` — strip fires here.
const top = new ColumnMetadata({
    args: { options: {} },
})

// Function-param shadow — the rewrite must NOT fire on the inner callee.
function buildFromParam(ColumnMetadata: {
    new (opts: {
        args: { options: { width: number; zerofill: boolean } }
    }): unknown
}) {
    return new ColumnMetadata({
        args: { options: { width: 10, zerofill: true } },
    })
}

// Nested const shadow — same story.
function buildFromLocal() {
    const ColumnMetadata = class {
        constructor(_opts: {
            args: { options: { width: number; zerofill: boolean } }
        }) {}
    }
    return new ColumnMetadata({
        args: { options: { width: 10, zerofill: true } },
    })
}

export { top, buildFromParam, buildFromLocal }
