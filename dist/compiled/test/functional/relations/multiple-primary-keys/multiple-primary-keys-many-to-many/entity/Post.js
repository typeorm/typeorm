"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var ManyToMany_1 = require("../../../../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../../../../src/decorator/relations/JoinTable");
var Category_1 = require("./Category");
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
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.posts; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categories", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.postsWithOptions; }),
        JoinTable_1.JoinTable({
            name: "post_categories",
            joinColumns: [{
                    name: "postId",
                    referencedColumnName: "id"
                }],
            inverseJoinColumns: [{
                    name: "categoryName",
                    referencedColumnName: "name"
                }, {
                    name: "categoryType",
                    referencedColumnName: "type"
                }]
        }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categoriesWithOptions", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.postsWithNonPKColumns; }),
        JoinTable_1.JoinTable({
            name: "post_categories_non_primary",
            joinColumns: [{
                    name: "postId",
                    referencedColumnName: "id"
                }],
            inverseJoinColumns: [{
                    name: "categoryCode",
                    referencedColumnName: "code"
                }, {
                    name: "categoryVersion",
                    referencedColumnName: "version"
                }, {
                    name: "categoryDescription",
                    referencedColumnName: "description"
                }]
        }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categoriesWithNonPKColumns", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map