"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var PostImage = /** @class */ (function () {
    function PostImage() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostImage.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostImage.prototype, "url", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.images; }),
        tslib_1.__metadata("design:type", Array)
    ], PostImage.prototype, "posts", void 0);
    PostImage = tslib_1.__decorate([
        index_1.Entity("sample4_post_image")
    ], PostImage);
    return PostImage;
}());
exports.PostImage = PostImage;
//# sourceMappingURL=PostImage.js.map