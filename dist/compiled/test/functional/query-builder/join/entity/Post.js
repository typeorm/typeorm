"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../../src/decorator/relations/ManyToOne");
var ManyToMany_1 = require("../../../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../../../src/decorator/relations/JoinTable");
var OneToOne_1 = require("../../../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../../../src/decorator/relations/JoinColumn");
var User_1 = require("./User");
var Category_1 = require("./Category");
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
        ManyToOne_1.ManyToOne(function (type) { return Tag_1.Tag; }),
        tslib_1.__metadata("design:type", Tag_1.Tag)
    ], Post.prototype, "tag", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return User_1.User; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", User_1.User)
    ], Post.prototype, "author", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.posts; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categories", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map