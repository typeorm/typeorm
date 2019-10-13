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
var JoinTable_1 = require("../../../src/decorator/relations/JoinTable");
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
        index_1.ManyToMany(function (type) { return PostCategory_1.PostCategory; }, {
            cascade: true
        }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categories", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return PostDetails_1.PostDetails; }, function (details) { return details.posts; }, {
            cascade: ["insert"]
        }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "details", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return PostImage_1.PostImage; }, function (image) { return image.posts; }, {
            cascade: ["update"]
        }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "images", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return PostMetadata_1.PostMetadata; }, function (metadata) { return metadata.posts; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "metadatas", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return PostInformation_1.PostInformation; }, function (information) { return information.posts; }, {
            cascade: true
        }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "informations", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return PostAuthor_1.PostAuthor; }, function (author) { return author.posts; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "authors", void 0);
    Post = tslib_1.__decorate([
        index_1.Entity("sample4_post")
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map