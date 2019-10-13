"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var ObjectIdColumn_1 = require("../../../src/decorator/columns/ObjectIdColumn");
var typings_1 = require("../../../src/driver/mongodb/typings");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        ObjectIdColumn_1.ObjectIdColumn(),
        tslib_1.__metadata("design:type", typings_1.ObjectID)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        index_1.Column("int", {
            nullable: false
        }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "likesCount", void 0);
    Post = tslib_1.__decorate([
        index_1.Entity("sample34_post")
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map