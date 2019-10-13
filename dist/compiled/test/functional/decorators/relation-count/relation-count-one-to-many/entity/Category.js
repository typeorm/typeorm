"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../../../src/decorator/relations/ManyToOne");
var OneToMany_1 = require("../../../../../../src/decorator/relations/OneToMany");
var RelationCount_1 = require("../../../../../../src/decorator/relations/RelationCount");
var Image_1 = require("./Image");
var Post_1 = require("./Post");
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
        ManyToOne_1.ManyToOne(function (type) { return Post_1.Post; }, function (post) { return post.categories; }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], Category.prototype, "post", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Image_1.Image; }, function (image) { return image.category; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "images", void 0);
    tslib_1.__decorate([
        RelationCount_1.RelationCount(function (category) { return category.images; }),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "imageCount", void 0);
    tslib_1.__decorate([
        RelationCount_1.RelationCount(function (category) { return category.images; }, "removedImages", function (qb) { return qb.andWhere("removedImages.isRemoved = :isRemoved", { isRemoved: true }); }),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "removedImageCount", void 0);
    Category = tslib_1.__decorate([
        Entity_1.Entity()
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map