import { Column, ColumnMetadata } from "typeorm"

declare const width: string
declare const args: string
declare const metadata: any

// Computed keys are variable lookups, not literal property names. Even when
// the identifier happens to be `width` or `zerofill`, the property name at
// runtime depends on the variable's value — we must NOT strip computed keys.
class Post {
    @Column({ [width]: 10, [widthLiteral]: 10, zerofill: true })
    postCode: number
}

declare const widthLiteral: "width"

// `new ColumnMetadata({[args]: {...}})` — computed `args` key must not match
// the literal `args` option. Leave the constructor untouched.
const col = new ColumnMetadata({
    entityMetadata: metadata,
    [args]: {
        target: "A",
        mode: "regular",
        propertyName: "a",
        options: {
            type: "int",
            width: 10,
            zerofill: true,
        },
    },
})
