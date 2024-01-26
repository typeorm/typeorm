import { EntitySchema } from "../../../../../../src/index"

export const PersonSchema = new EntitySchema<any>({
    name: "Person",
    columns: {
        Id: {
            primary: true,
            type: "int",
            generated: "increment",
        },
        FirstName: {
            type: String,
            length: 30,
        },
        LastName: {
            type: String,
            length: 50,
            nullable: false,
        },
        Location: {
            type: "point",
            nullable: false,
        },
    },
    indices: [
        {
            spatial: true,
            columns: ["Location"],
        },
        {
            fulltext: true,
            columns: ["FirstName", "LastName"],
        },
    ],
})
