"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var OneToOne_1 = require("../../../../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../../../../src/decorator/relations/JoinColumn");
var Category_1 = require("./Category");
var RelationId_1 = require("../../../../../../src/decorator/relations/RelationId");
var Post = /** @class */ (function () {
    function Post() {
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
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "category", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }),
        JoinColumn_1.JoinColumn({ referencedColumnName: "name" }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "categoryByName", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }, function (category) { return category.post; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "category2", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (post) { return post.category; }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "categoryId", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (post) { return post.categoryByName; }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "categoryName", void 0);
    tslib_1.__decorate([
        RelationId_1.RelationId(function (post) { return post.category2; }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "category2Id", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map