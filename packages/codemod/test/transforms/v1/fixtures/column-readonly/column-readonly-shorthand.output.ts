import { Column, ColumnMetadata } from "typeorm"

declare const metadata: any
declare const readonly: boolean

// Shorthand-property form `{ readonly }` folds key and value into the same
// Identifier node. The rewrite renames the key to `update` and wraps the
// value with a leading `!` — and must also clear the `shorthand` flag so
// the printer doesn't emit `{ update }` with mismatched key/value.
class Post {
    @Column({ update: !readonly })
    codeA: number
}

const col = new ColumnMetadata({
    entityMetadata: metadata,
    args: {
        target: "A",
        mode: "regular",
        propertyName: "a",
        options: {
            type: "varchar",
            update: !readonly,
        },
    },
})
