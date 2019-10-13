"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var PostDetails_1 = require("./PostDetails");
var Category = /** @class */ (function () {
    function Category() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "description", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.categories; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "posts", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return PostDetails_1.PostDetails; }, function (postDetails) { return postDetails.categories; }),
        tslib_1.__metadata("design:type", PostDetails_1.PostDetails)
    ], Category.prototype, "details", void 0);
    Category = tslib_1.__decorate([
        index_1.Entity("sample10_category")
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map