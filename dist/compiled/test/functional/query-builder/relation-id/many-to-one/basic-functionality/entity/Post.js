"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../../../../src/decorator/relations/ManyToOne");
var JoinColumn_1 = require("../../../../../../../src/decorator/relations/JoinColumn");
var OneToMany_1 = require("../../../../../../../src/decorator/relations/OneToMany");
var Category_1 = require("./Category");
var PostCategory_1 = require("./PostCategory");
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
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }),
        JoinColumn_1.JoinColumn({ referencedColumnName: "name" }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "categoryByName", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "category", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return PostCategory_1.PostCategory; }, function (postCategoryRelation) { return postCategoryRelation.post; }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categories", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map