"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var ManyToOne_1 = require("../../../../../src/decorator/relations/ManyToOne");
var JoinColumn_1 = require("../../../../../src/decorator/relations/JoinColumn");
var Category_1 = require("./Category");
var OneToOne_1 = require("../../../../../src/decorator/relations/OneToOne");
var Tag_1 = require("./Tag");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "categoryName", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: "int", nullable: true }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "categoryId", void 0);
    tslib_1.__decorate([
        Column_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "tagName", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: "int", nullable: true }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "tagId", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "categoryWithEmptyJoinCol", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }),
        JoinColumn_1.JoinColumn({ name: "categoryId" }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "categoryWithoutRefColName", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }),
        JoinColumn_1.JoinColumn({ referencedColumnName: "name" }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "categoryWithoutColName", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }),
        JoinColumn_1.JoinColumn({ name: "categoryIdentifier" }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "categoryWithoutRefColName2", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }),
        JoinColumn_1.JoinColumn({ name: "categoryName", referencedColumnName: "name" }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "category", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Tag_1.Tag; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Tag_1.Tag)
    ], Post.prototype, "tagWithEmptyJoinCol", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Tag_1.Tag; }),
        JoinColumn_1.JoinColumn({ name: "tagId" }),
        tslib_1.__metadata("design:type", Tag_1.Tag)
    ], Post.prototype, "tagWithoutRefColName", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Tag_1.Tag; }),
        JoinColumn_1.JoinColumn({ referencedColumnName: "name" }),
        tslib_1.__metadata("design:type", Tag_1.Tag)
    ], Post.prototype, "tagWithoutColName", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Tag_1.Tag; }),
        JoinColumn_1.JoinColumn({ name: "tagIdentifier" }),
        tslib_1.__metadata("design:type", Tag_1.Tag)
    ], Post.prototype, "tagWithoutRefColName2", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Tag_1.Tag; }),
        JoinColumn_1.JoinColumn({ name: "tagName", referencedColumnName: "name" }),
        tslib_1.__metadata("design:type", Tag_1.Tag)
    ], Post.prototype, "tag", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map