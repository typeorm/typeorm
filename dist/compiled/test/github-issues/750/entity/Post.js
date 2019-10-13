"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Index_1 = require("../../../../src/decorator/Index");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column("point"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "point", void 0);
    tslib_1.__decorate([
        Column_1.Column("polygon"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "polygon", void 0);
    Post = tslib_1.__decorate([
        src_1.Entity(),
        Index_1.Index(["name"], { fulltext: true }),
        Index_1.Index(["point"], { spatial: true })
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map