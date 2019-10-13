"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var PostDetails_1 = require("./PostDetails");
var PostCategory_1 = require("./PostCategory");
var PostAuthor_1 = require("./PostAuthor");
var PostInformation_1 = require("./PostInformation");
var PostImage_1 = require("./PostImage");
var PostMetadata_1 = require("./PostMetadata");
var JoinColumn_1 = require("../../../src/decorator/relations/JoinColumn");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return PostCategory_1.PostCategory; }, {
            cascade: true
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", PostCategory_1.PostCategory)
    ], Post.prototype, "category", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return PostDetails_1.PostDetails; }, function (details) { return details.post; }, {
            cascade: ["insert"]
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", PostDetails_1.PostDetails)
    ], Post.prototype, "details", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return PostImage_1.PostImage; }, function (image) { return image.post; }, {
            cascade: ["update"]
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", PostImage_1.PostImage)
    ], Post.prototype, "image", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return PostMetadata_1.PostMetadata; }, function (metadata) { return metadata.post; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "metadata", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return PostInformation_1.PostInformation; }, function (information) { return information.post; }, {
            cascade: true
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", PostInformation_1.PostInformation)
    ], Post.prototype, "information", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return PostAuthor_1.PostAuthor; }, function (author) { return author.post; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", PostAuthor_1.PostAuthor)
    ], Post.prototype, "author", void 0);
    Post = tslib_1.__decorate([
        index_1.Entity("sample2_post")
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map