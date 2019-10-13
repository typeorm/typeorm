"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../../../../../../src");
exports.PersonSchema = new src_1.EntitySchema({
    name: "Person",
    columns: {
        Id: {
            primary: true,
            type: "int",
            unsigned: true,
            generated: "increment"
        },
        PostCode: {
            type: "int",
            width: 9,
            zerofill: true,
        },
        FirstName: {
            type: String,
            length: 30
        },
        LastName: {
            type: String,
            length: 50,
        },
        VirtualFullName: {
            type: String,
            length: 50,
            asExpression: "concat(`FirstName`,' ',`LastName`)"
        },
        StoredFullName: {
            type: String,
            length: 50,
            asExpression: "concat(`FirstName`,' ',`LastName`)",
            generatedType: "STORED"
        },
        LastVisitDate: {
            type: "timestamp",
            precision: 3,
            default: function () { return "CURRENT_TIMESTAMP(3)"; },
            onUpdate: "CURRENT_TIMESTAMP(3)"
        }
    }
});
//# sourceMappingURL=Person.js.map