"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ViewColumn_1 = require("../../../../../src/decorator/columns/ViewColumn");
var ViewEntity_1 = require("../../../../../src/decorator/entity-view/ViewEntity");
var Category_1 = require("./Category");
var Post_1 = require("./Post");
var PostCategory = /** @class */ (function () {
    function PostCategory() {
    }
    tslib_1.__decorate([
        ViewColumn_1.ViewColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostCategory.prototype, "id", void 0);
    tslib_1.__decorate([
        ViewColumn_1.ViewColumn(),
        tslib_1.__metadata("design:type", String)
    ], PostCategory.prototype, "name", void 0);
    tslib_1.__decorate([
        ViewColumn_1.ViewColumn(),
        tslib_1.__metadata("design:type", String)
    ], PostCategory.prototype, "categoryName", void 0);
    PostCategory = tslib_1.__decorate([
        ViewEntity_1.ViewEntity({
            expression: function (connection) { return connection.createQueryBuilder()
                .select("post.id", "id")
                .addSelect("post.name", "name")
                .addSelect("category.name", "categoryName")
                .from(Post_1.Post, "post")
                .leftJoin(Category_1.Category, "category", "category.id = post.categoryId"); }
        })
    ], PostCategory);
    return PostCategory;
}());
exports.PostCategory = PostCategory;
//# sourceMappingURL=PostCategory.js.map