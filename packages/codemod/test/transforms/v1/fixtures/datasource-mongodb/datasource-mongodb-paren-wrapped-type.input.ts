import { DataSource } from "typeorm"

// Parenthesized `type` literal, and parens wrapping an `as const` cast.
// The scope guard must peel the `ParenthesizedExpression` before matching
// the string literal — otherwise deprecated MongoDB options go
// un-migrated.
// prettier-ignore
const dsParen = new DataSource({
    type: ("mongodb"),
    sslValidate: true,
})

// prettier-ignore
const dsParenAsConst = new DataSource({
    type: ("mongodb" as const),
    sslValidate: false,
})
