import * as typeorm from "typeorm"

// Top-level namespace import — rewrite fires.
const top = new typeorm.ColumnMetadata({
    args: { options: { width: 10, zerofill: true } },
})

// `typeorm` as a function parameter shadows the top-level namespace import.
// `new typeorm.ColumnMetadata(...)` refers to the parameter, not the import,
// so the rewrite must NOT fire here.
function buildFromParam(typeorm: {
    ColumnMetadata: {
        new (opts: {
            args: { options: { width: number; zerofill: boolean } }
        }): unknown
    }
}) {
    return new typeorm.ColumnMetadata({
        args: { options: { width: 10, zerofill: true } },
    })
}

// Nested `const` re-binding of `typeorm`.
function buildFromLocal() {
    const typeorm = {
        ColumnMetadata: class {
            constructor(_opts: {
                args: { options: { width: number; zerofill: boolean } }
            }) {}
        },
    }
    return new typeorm.ColumnMetadata({
        args: { options: { width: 10, zerofill: true } },
    })
}

export { top, buildFromParam, buildFromLocal }
