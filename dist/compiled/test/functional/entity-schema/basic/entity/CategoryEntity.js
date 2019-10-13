"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../../../../../src");
exports.CategoryEntity = new src_1.EntitySchema({
    name: "category",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true
        },
        name: {
            type: String
        }
    }
});
//# sourceMappingURL=CategoryEntity.js.map