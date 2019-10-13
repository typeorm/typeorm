"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Post_1 = require("./Post");
var Author = /** @class */ (function () {
    function Author() {
    }
    return Author;
}());
exports.Author = Author;
exports.AuthorSchema = {
    name: "Author",
    target: Author,
    columns: {
        id: {
            primary: true,
            type: Number
        },
        name: {
            type: "varchar"
        }
    },
    relations: {
        posts: {
            target: function () { return Post_1.Post; },
            type: "one-to-many"
        }
    }
};
//# sourceMappingURL=Author.js.map