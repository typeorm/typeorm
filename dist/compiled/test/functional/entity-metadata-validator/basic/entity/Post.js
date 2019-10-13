"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var OneToOne_1 = require("../../../../../src/decorator/relations/OneToOne");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var RelationCount_1 = require("../../../../../src/decorator/relations/RelationCount");
var ManyToMany_1 = require("../../../../../src/decorator/relations/ManyToMany");
var Category_1 = require("./Category");
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
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "category", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "category2", void 0);
    tslib_1.__decorate([
        RelationCount_1.RelationCount(function (post) { return post.category; }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "categoryCount", void 0);
    tslib_1.__decorate([
        RelationCount_1.RelationCount(function (post) { return post.category2; }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "categoryCount2", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map