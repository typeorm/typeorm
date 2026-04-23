import { ColumnMetadata } from "typeorm"

declare const metadata: any
declare const tenantConnectionService: { connection: any }

// `connection` key with a complex (non-shorthand) value — e.g. a member
// expression from a user-side service. The codemod should still drop the
// whole property, not just the key or the value.
const col = new ColumnMetadata({
    connection: tenantConnectionService.connection,
    entityMetadata: metadata,
    args: {
        target: "A",
        mode: "regular",
        propertyName: "a",
        options: {
            type: "nvarchar",
            name: "A",
            length: 10,
            nullable: true,
            primary: false,
            comment: "A description",
        },
    },
})
