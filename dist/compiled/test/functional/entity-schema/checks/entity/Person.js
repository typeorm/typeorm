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
        },
        Age: {
            type: Number,
            nullable: false
        }
    },
    checks: [
        { expression: "\"FirstName\" <> 'John' AND \"LastName\" <> 'Doe'" },
        { expression: "\"Age\" > 18" }
    ]
});
//# sourceMappingURL=Person.js.map