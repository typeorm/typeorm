"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Post_1 = require("./Post");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var Category_1 = require("./Category");
var PostCategory = /** @class */ (function () {
    function PostCategory() {
    }
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Post_1.Post; }, function (post) { return post.categories; }, {
            primary: true,
            cascade: ["insert"]
        }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], PostCategory.prototype, "post", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }, function (category) { return category.posts; }, {
            primary: true,
            cascade: ["insert"]
        }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], PostCategory.prototype, "category", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], PostCategory.prototype, "addedByAdmin", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], PostCategory.prototype, "addedByUser", void 0);
    PostCategory = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostCategory);
    return PostCategory;
}());
exports.PostCategory = PostCategory;
//# sourceMappingURL=PostCategory.js.map