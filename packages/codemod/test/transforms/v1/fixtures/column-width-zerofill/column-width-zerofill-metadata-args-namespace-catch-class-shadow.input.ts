import * as typeorm from "typeorm"

// Top-level namespace import is the real TypeORM `typeorm` — strip fires.
const top = new typeorm.ColumnMetadata({
    args: { options: { width: 10, zerofill: true } },
})

// Catch-clause binding shadows the namespace — strip must NOT fire.
function handle() {
    try {
        throw new Error("boom")
    } catch (typeorm: any) {
        return new typeorm.ColumnMetadata({
            args: { options: { width: 10, zerofill: true } },
        })
    }
}

// Nested class declaration shadows the namespace — strip must NOT fire.
function buildFromClass() {
    class typeorm {
        static ColumnMetadata = class {
            constructor(_opts: {
                args: { options: { width: number; zerofill: boolean } }
            }) {}
        }
    }
    return new typeorm.ColumnMetadata({
        args: { options: { width: 10, zerofill: true } },
    })
}

export { top, handle, buildFromClass }
