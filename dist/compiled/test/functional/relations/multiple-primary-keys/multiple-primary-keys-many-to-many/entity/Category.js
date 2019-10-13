"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var Post_1 = require("./Post");
var ManyToMany_1 = require("../../../../../../src/decorator/relations/ManyToMany");
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
        ManyToMany_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.categories; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "posts", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.categoriesWithOptions; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "postsWithOptions", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.categoriesWithNonPKColumns; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "postsWithNonPKColumns", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Tag_1.Tag; }, function (tag) { return tag.categories; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "tags", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Tag_1.Tag; }, function (tag) { return tag.categoriesWithOptions; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "tagsWithOptions", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Tag_1.Tag; }, function (tag) { return tag.categoriesWithNonPKColumns; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "tagsWithNonPKColumns", void 0);
    Category = tslib_1.__decorate([
        Entity_1.Entity(),
        src_1.Unique(["code", "version", "description"])
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map