export const PersonSchema = {
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
        }
    },
    relations: {},
    indices: {
        IDX_UNQ_Person: {
            unique: false,
            columns: [
                "FirstName",
                "LastName"
            ]
        }
    }
};