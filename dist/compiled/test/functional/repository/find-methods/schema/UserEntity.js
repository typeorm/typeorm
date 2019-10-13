"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../../../../../src");
exports.UserEntity = new src_1.EntitySchema({
    "name": "User",
    "tableName": "user",
    "columns": {
        "id": {
            "type": Number,
            "primary": true
        },
        "firstName": {
            "type": "varchar",
            "nullable": false
        },
        "secondName": {
            "type": "varchar",
            "nullable": false
        }
    }
});
//# sourceMappingURL=UserEntity.js.map