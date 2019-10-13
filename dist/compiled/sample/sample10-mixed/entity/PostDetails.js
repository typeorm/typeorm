"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var Chapter_1 = require("./Chapter");
var Category_1 = require("./Category");
var PostDetails = /** @class */ (function () {
    function PostDetails() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostDetails.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostDetails.prototype, "meta", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostDetails.prototype, "comment", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return Post_1.Post; }, function (post) { return post.details; }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], PostDetails.prototype, "post", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return Category_1.Category; }, function (category) { return category.details; }, {
            cascade: ["insert"]
        }),
        tslib_1.__metadata("design:type", Array)
    ], PostDetails.prototype, "categories", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return Chapter_1.Chapter; }, function (chapter) { return chapter.postDetails; }, {
            cascade: ["insert"]
        }),
        tslib_1.__metadata("design:type", Chapter_1.Chapter)
    ], PostDetails.prototype, "chapter", void 0);
    PostDetails = tslib_1.__decorate([
        index_1.Entity("sample10_post_details")
    ], PostDetails);
    return PostDetails;
}());
exports.PostDetails = PostDetails;
//# sourceMappingURL=PostDetails.js.map