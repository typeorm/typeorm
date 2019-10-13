"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../../../../../src/index");
exports.PersonSchema = new index_1.EntitySchema({
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
    uniques: [
        {
            name: "UNIQUE_TEST",
            columns: [
                "FirstName",
                "LastName"
            ]
        }
    ]
});
//# sourceMappingURL=Person.js.map