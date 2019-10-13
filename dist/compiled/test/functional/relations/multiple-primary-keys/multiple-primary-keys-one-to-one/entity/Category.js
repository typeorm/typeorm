"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var OneToOne_1 = require("../../../../../../src/decorator/relations/OneToOne");
var Post_1 = require("./Post");
var Tag_1 = require("./Tag");
var src_1 = require("../../../../../../src");
var Category = /** @class */ (function () {
    function Category() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "name", void 0);
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "type", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "code", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "version", void 0);
    tslib_1.__decorate([
        Column_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "description", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Post_1.Post; }, function (post) { return post.category; }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], Category.prototype, "post", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Post_1.Post; }, function (post) { return post.categoryWithOptions; }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], Category.prototype, "postWithOptions", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Post_1.Post; }, function (post) { return post.categoryWithNonPKColumns; }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], Category.prototype, "postWithNonPKColumns", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Tag_1.Tag; }, function (tag) { return tag.category; }),
        tslib_1.__metadata("design:type", Tag_1.Tag)
    ], Category.prototype, "tag", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Tag_1.Tag; }, function (tag) { return tag.categoryWithOptions; }),
        tslib_1.__metadata("design:type", Tag_1.Tag)
    ], Category.prototype, "tagWithOptions", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Tag_1.Tag; }, function (tag) { return tag.categoryWithNonPKColumns; }),
        tslib_1.__metadata("design:type", Tag_1.Tag)
    ], Category.prototype, "tagWithNonPKColumns", void 0);
    Category = tslib_1.__decorate([
        Entity_1.Entity(),
        src_1.Unique(["code", "version", "description"])
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map