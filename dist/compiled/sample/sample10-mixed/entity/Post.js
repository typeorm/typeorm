"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Image_1 = require("./Image");
var Cover_1 = require("./Cover");
var Category_1 = require("./Category");
var PostDetails_1 = require("./PostDetails");
var JoinColumn_1 = require("../../../src/decorator/relations/JoinColumn");
var JoinTable_1 = require("../../../src/decorator/relations/JoinTable");
var Post = /** @class */ (function () {
    function Post() {
        this.images = [];
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column({
            nullable: false
        }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        index_1.Column({
            nullable: false
        }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return PostDetails_1.PostDetails; }, function (details) { return details.post; }, {
            cascade: true
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", PostDetails_1.PostDetails)
    ], Post.prototype, "details", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return Image_1.Image; }, function (image) { return image.post; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "images", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return Image_1.Image; }, function (image) { return image.secondaryPost; }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "secondaryImages", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return Cover_1.Cover; }, function (cover) { return cover.posts; }, {
            cascade: ["insert"]
        }),
        JoinColumn_1.JoinColumn({ name: "coverId" }),
        tslib_1.__metadata("design:type", Cover_1.Cover)
    ], Post.prototype, "cover", void 0);
    tslib_1.__decorate([
        index_1.Column("int", {
            nullable: true
        }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "coverId", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.posts; }, {
            cascade: true
        }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categories", void 0);
    Post = tslib_1.__decorate([
        index_1.Entity("sample10_post")
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map