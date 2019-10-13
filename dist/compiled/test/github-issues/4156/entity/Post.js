"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Author_1 = require("./Author");
var Post = /** @class */ (function () {
    function Post() {
    }
    return Post;
}());
exports.Post = Post;
exports.PostSchema = {
    name: "Post",
    target: Post,
    columns: {
        id: {
            primary: true,
            type: Number
        },
        title: {
            type: "varchar"
        }
    },
    relations: {
        author: {
            target: function () { return Author_1.Author; },
            type: "many-to-one",
            eager: true
        }
    }
};
//# sourceMappingURL=Post.js.map