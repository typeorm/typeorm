import { Column, ColumnMetadata } from "typeorm"

declare const metadata: any

// Constant computed-string keys like `['readonly']: …` or `["readonly"]: …`
// are statically knowable — they're the same runtime key as the plain
// identifier form `readonly: …`. The rewrite must fire on them, and the
// replacement should be emitted as a non-computed identifier key (`update: …`).
class Post {
    @Column({ update: false })
    codeA: number

    @Column({ update: true })
    codeB: number
}

// Same treatment inside `new ColumnMetadata({ args: { options: {...} } })`,
// including when the intermediate `args` / `options` keys themselves are in
// the computed-string form.
const col = new ColumnMetadata({
    entityMetadata: metadata,
    ["args"]: {
        target: "A",
        mode: "regular",
        propertyName: "a",
        ["options"]: {
            type: "varchar",
            update: false,
        },
    },
})
