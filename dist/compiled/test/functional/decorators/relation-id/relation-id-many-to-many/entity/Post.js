"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var ManyToMany_1 = require("../../../../../../src/decorator/relations/ManyToMany");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var JoinTable_1 = require("../../../../../../src/decorator/relations/JoinTable");
var RelationId_1 = require("../../../../../../src/decorator/relations/RelationId");
var Category_1 = require("./Category");
var Post = /** @class */ (function () {
    function Post() {
        this.isRemoved = false;
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], Post.prototype, "isRemoved", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.posts; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categories", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "subcategories", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (post) { return post.categories; }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categoryIds", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (post) { return post.categories; }, "rc", function (qb) { return qb.andWhere("rc.isRemoved = :isRemoved", { isRemoved: true }); }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "removedCategoryIds", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (post) { return post.subcategories; }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "subcategoryIds", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (post) { return post.subcategories; }, "rsc", function (qb) { return qb.andWhere("rsc.isRemoved = :isRemoved", { isRemoved: true }); }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "removedSubcategoryIds", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map