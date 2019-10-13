"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column("enum", { enum: ["A", "B", "C"] }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "enum", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "name", void 0);
    Post = tslib_1.__decorate([
        src_1.Entity({ schema: "schema" })
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map