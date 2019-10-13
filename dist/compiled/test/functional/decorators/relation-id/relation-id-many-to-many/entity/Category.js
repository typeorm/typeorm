"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var ManyToMany_1 = require("../../../../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../../../../src/decorator/relations/JoinTable");
var Post_1 = require("./Post");
var Image_1 = require("./Image");
var RelationId_1 = require("../../../../../../src/decorator/relations/RelationId");
var Category = /** @class */ (function () {
    function Category() {
        this.isRemoved = false;
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], Category.prototype, "isRemoved", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.categories; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "posts", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Image_1.Image; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "images", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (category) { return category.images; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "imageIds", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (category) { return category.images; }, "removedImages", function (qb) { return qb.andWhere("removedImages.isRemoved = :isRemoved", { isRemoved: true }); }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "removedImageIds", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (category) { return category.posts; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "postIds", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (category) { return category.posts; }, "removedPosts", function (qb) { return qb.andWhere("removedPosts.isRemoved = :isRemoved", { isRemoved: true }); }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "removedPostIds", void 0);
    Category = tslib_1.__decorate([
        Entity_1.Entity()
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map