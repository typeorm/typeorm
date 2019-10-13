"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var ManyToMany_1 = require("../../../../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../../../../src/decorator/relations/JoinTable");
var ManyToOne_1 = require("../../../../../../src/decorator/relations/ManyToOne");
var OneToOne_1 = require("../../../../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../../../../src/decorator/relations/JoinColumn");
var Category_1 = require("./Category");
var Post = /** @class */ (function () {
    function Post() {
        this.viewCount = 0;
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn({
            name: "s_post_id"
        }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Promise)
    ], Post.prototype, "categories", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.twoSidePosts; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Promise)
    ], Post.prototype, "twoSideCategories", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "viewCount", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }),
        tslib_1.__metadata("design:type", Promise)
    ], Post.prototype, "category", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }, function (category) { return category.onePost; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Promise)
    ], Post.prototype, "oneCategory", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }, function (category) { return category.twoSidePosts2; }),
        tslib_1.__metadata("design:type", Promise)
    ], Post.prototype, "twoSideCategory", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.postsNamedAll; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Promise)
    ], Post.prototype, "categoriesNamedAll", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }, function (category) { return category.onePostsNamedAll; }),
        JoinColumn_1.JoinColumn({
            name: "s_category_named_all_id"
        }),
        tslib_1.__metadata("design:type", Promise)
    ], Post.prototype, "categoryNamedAll", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }, function (category) { return category.onePostNamedAll; }),
        JoinColumn_1.JoinColumn({
            name: "s_one_category_named_all_id"
        }),
        tslib_1.__metadata("design:type", Promise)
    ], Post.prototype, "oneCategoryNamedAll", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity("s_post_named_all", {
            orderBy: {
                title: "ASC",
                id: "DESC",
            }
        })
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map