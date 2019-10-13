"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Index_1 = require("../../../../src/decorator/Index");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var Tag_1 = require("./Tag");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "a", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "b", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "c", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function () { return Tag_1.Tag; }),
        tslib_1.__metadata("design:type", Tag_1.Tag)
    ], Post.prototype, "tag", void 0);
    Post = tslib_1.__decorate([
        Index_1.Index(["a", "b", "c", "tag"]),
        Index_1.Index(["b", "tag", "c"]),
        Index_1.Index(["c", "a"]),
        Entity_1.Entity("Posts")
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map