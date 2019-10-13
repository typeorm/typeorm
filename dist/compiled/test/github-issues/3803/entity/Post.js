"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        name: {
            type: "varchar",
            unique: true
        },
        title: {
            type: "varchar"
        }
    }
};
//# sourceMappingURL=Post.js.map