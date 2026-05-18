import { Column, ColumnMetadata } from "typeorm"

declare const readonly: string
declare const args: string
declare const metadata: any

// Computed keys are variable lookups, not literal property names. Even when
// the identifier happens to be `readonly`, the property name at runtime
// depends on the variable's value — we must NOT rewrite computed keys.
class Post {
    @Column({ [readonly]: true, [readonlyLiteral]: true })
    postCode: number
}

declare const readonlyLiteral: "readonly"

// `new ColumnMetadata({[args]: {...}})` — computed `args` key must not match
// the literal `args` option. Leave the constructor untouched.
const col = new ColumnMetadata({
    entityMetadata: metadata,
    [args]: {
        target: "A",
        mode: "regular",
        propertyName: "a",
        options: {
            type: "varchar",
            readonly: true,
        },
    },
})
