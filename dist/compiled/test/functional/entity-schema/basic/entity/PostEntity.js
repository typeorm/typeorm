"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../../../../../src");
exports.PostEntity = new src_1.EntitySchema({
    name: "post",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true
        },
        title: {
            type: String
        },
        text: {
            type: String
        }
    },
    relations: {
        categories: {
            type: "many-to-many",
            target: "category" // CategoryEntity
        }
    }
});
//# sourceMappingURL=PostEntity.js.map