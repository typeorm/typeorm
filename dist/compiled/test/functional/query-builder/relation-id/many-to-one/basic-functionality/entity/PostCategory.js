"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../../src/decorator/entity/Entity");
var ManyToOne_1 = require("../../../../../../../src/decorator/relations/ManyToOne");
var Post_1 = require("./Post");
var Category_1 = require("./Category");
var Image_1 = require("./Image");
var PostCategory = /** @class */ (function () {
    function PostCategory() {
    }
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Post_1.Post; }, function (post) { return post.categories; }, {
            primary: true
        }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], PostCategory.prototype, "post", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }, function (category) { return category.posts; }, {
            primary: true
        }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], PostCategory.prototype, "category", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Image_1.Image; }),
        tslib_1.__metadata("design:type", Image_1.Image)
    ], PostCategory.prototype, "image", void 0);
    PostCategory = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostCategory);
    return PostCategory;
}());
exports.PostCategory = PostCategory;
//# sourceMappingURL=PostCategory.js.map