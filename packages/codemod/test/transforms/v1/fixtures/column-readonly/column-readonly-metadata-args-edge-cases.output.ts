import { ColumnMetadata as CM } from "typeorm"

declare const metadata: any

// Edge cases: aliased import (`as CM`) and `options` wrapped in a TS
// `satisfies` expression — both must still be walked and rewritten.
const a = new CM({
    entityMetadata: metadata,
    args: {
        target: "A",
        mode: "regular",
        propertyName: "a",
        options: {
            type: "varchar",
            update: false,
        } satisfies Record<string, unknown>,
    },
})
