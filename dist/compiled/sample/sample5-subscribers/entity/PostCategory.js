"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var ManyToMany_1 = require("../../../src/decorator/relations/ManyToMany");
var PostCategory = /** @class */ (function () {
    function PostCategory() {
        this.posts = [];
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostCategory.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostCategory.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.categories; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", Array)
    ], PostCategory.prototype, "posts", void 0);
    PostCategory = tslib_1.__decorate([
        index_1.Entity("sample5_post_category")
    ], PostCategory);
    return PostCategory;
}());
exports.PostCategory = PostCategory;
//# sourceMappingURL=PostCategory.js.map