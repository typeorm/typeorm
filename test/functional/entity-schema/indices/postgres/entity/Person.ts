import {EntitySchema} from "../../../../../../src/index";

export const PersonSchema = new EntitySchema<any>({
    name: "Person",
    columns: {
        Id: {
            primary: true,
            type: "int",
            generated: "increment"
        },
        FirstName: {
            type: String,
            length: 30
        },
        LastName: {
            type: String,
            length: 50,
            nullable: false
        },
        Location: {
            type: "point",
            nullable: false
        }
    },
    indices: [
        {
            name: "text_search_index",
            pgTextSearchIndex: {
                indexType: "GIN",
                operator: "gin_trgm_ops"
            },
            columns: [
                "FirstName"
            ]
        }
    ]
});