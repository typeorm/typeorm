import { Column, ColumnMetadata } from "typeorm"

declare const metadata: any

// Constant computed-string keys like `['width']: …` or `["zerofill"]: …` are
// statically knowable — same runtime key as the plain-identifier form. The
// strip must fire on them.
class Post {
    @Column({
        type: "int",
    })
    postCode: number
}

// Same treatment inside `new ColumnMetadata({ args: { options: {...} } })`,
// including when the intermediate `args` / `options` keys are computed.
const col = new ColumnMetadata({
    entityMetadata: metadata,
    ["args"]: {
        target: "A",
        mode: "regular",
        propertyName: "a",
        ["options"]: {
            type: "int",
        },
    },
})
