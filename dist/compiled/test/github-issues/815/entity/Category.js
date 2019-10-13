"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var Post_1 = require("./Post");
var RelationId_1 = require("../../../../src/decorator/relations/RelationId");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var ManyToMany_1 = require("../../../../src/decorator/relations/ManyToMany");
var Category = /** @class */ (function () {
    function Category() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "firstId", void 0);
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "secondId", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Post_1.Post; }, function (post) { return post.categories; }),
        tslib_1.__metadata("design:type", Object)
    ], Category.prototype, "post", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (category) { return category.post; }),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "postId", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.manyCategories; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "manyPosts", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (category) { return category.manyPosts; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "manyPostIds", void 0);
    Category = tslib_1.__decorate([
        Entity_1.Entity()
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map