"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var ManyToMany_1 = require("../../../src/decorator/relations/ManyToMany");
var AfterRemove_1 = require("../../../src/decorator/listeners/AfterRemove");
var BeforeRemove_1 = require("../../../src/decorator/listeners/BeforeRemove");
var AfterUpdate_1 = require("../../../src/decorator/listeners/AfterUpdate");
var BeforeUpdate_1 = require("../../../src/decorator/listeners/BeforeUpdate");
var AfterInsert_1 = require("../../../src/decorator/listeners/AfterInsert");
var BeforeInsert_1 = require("../../../src/decorator/listeners/BeforeInsert");
var PostCategory = /** @class */ (function () {
    function PostCategory() {
        this.posts = [];
    }
    PostCategory.prototype.doSomethingBeforeInsertion = function () {
        console.log("event: PostCategory \"" + this.name + "\" will be inserted so soon...");
    };
    PostCategory.prototype.doSomethingAfterInsertion = function () {
        console.log("event: PostCategory \"" + this.name + "\" has been inserted and callback executed");
    };
    PostCategory.prototype.doSomethingBeforeUpdate = function () {
        console.log("event: PostCategory \"" + this.name + "\" will be updated so soon...");
    };
    PostCategory.prototype.doSomethingAfterUpdate = function () {
        console.log("event: PostCategory \"" + this.name + "\" has been updated and callback executed");
    };
    PostCategory.prototype.doSomethingBeforeRemove = function () {
        console.log("event: PostCategory \"" + this.name + "\" will be removed so soon...");
    };
    PostCategory.prototype.doSomethingAfterRemove = function () {
        console.log("event: PostCategory \"" + this.name + "\" has been removed and callback executed");
    };
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostCategory.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostCategory.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.categories; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", Array)
    ], PostCategory.prototype, "posts", void 0);
    tslib_1.__decorate([
        BeforeInsert_1.BeforeInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostCategory.prototype, "doSomethingBeforeInsertion", null);
    tslib_1.__decorate([
        AfterInsert_1.AfterInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostCategory.prototype, "doSomethingAfterInsertion", null);
    tslib_1.__decorate([
        BeforeUpdate_1.BeforeUpdate(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostCategory.prototype, "doSomethingBeforeUpdate", null);
    tslib_1.__decorate([
        AfterUpdate_1.AfterUpdate(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostCategory.prototype, "doSomethingAfterUpdate", null);
    tslib_1.__decorate([
        BeforeRemove_1.BeforeRemove(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostCategory.prototype, "doSomethingBeforeRemove", null);
    tslib_1.__decorate([
        AfterRemove_1.AfterRemove(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostCategory.prototype, "doSomethingAfterRemove", null);
    PostCategory = tslib_1.__decorate([
        index_1.Entity("sample9_post_category")
    ], PostCategory);
    return PostCategory;
}());
exports.PostCategory = PostCategory;
//# sourceMappingURL=PostCategory.js.map