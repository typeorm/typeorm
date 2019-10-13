"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var PrimaryColumn_1 = require("../../../src/decorator/columns/PrimaryColumn");
var Generated_1 = require("../../../src/decorator/Generated");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn("integer"),
        Generated_1.Generated(),
        tslib_1.__metadata("design:type", Number)
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
        index_1.Column({ nullable: false }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "likesCount", void 0);
    Post = tslib_1.__decorate([
        index_1.Entity("sample01_post")
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map