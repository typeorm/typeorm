"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var OneToMany_1 = require("../../../src/decorator/relations/OneToMany");
var AfterRemove_1 = require("../../../src/decorator/listeners/AfterRemove");
var BeforeRemove_1 = require("../../../src/decorator/listeners/BeforeRemove");
var AfterUpdate_1 = require("../../../src/decorator/listeners/AfterUpdate");
var BeforeUpdate_1 = require("../../../src/decorator/listeners/BeforeUpdate");
var AfterInsert_1 = require("../../../src/decorator/listeners/AfterInsert");
var BeforeInsert_1 = require("../../../src/decorator/listeners/BeforeInsert");
var PostAuthor = /** @class */ (function () {
    function PostAuthor() {
    }
    PostAuthor.prototype.doSomethingBeforeInsertion = function () {
        console.log("event: PostAuthor entity will be inserted so soon...");
    };
    PostAuthor.prototype.doSomethingAfterInsertion = function () {
        console.log("event: PostAuthor entity has been inserted and callback executed");
    };
    PostAuthor.prototype.doSomethingBeforeUpdate = function () {
        console.log("event: PostAuthor entity will be updated so soon...");
    };
    PostAuthor.prototype.doSomethingAfterUpdate = function () {
        console.log("event: PostAuthor entity has been updated and callback executed");
    };
    PostAuthor.prototype.doSomethingBeforeRemove = function () {
        console.log("event: PostAuthor entity will be removed so soon...");
    };
    PostAuthor.prototype.doSomethingAfterRemove = function () {
        console.log("event: PostAuthor entity has been removed and callback executed");
    };
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostAuthor.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostAuthor.prototype, "name", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Post_1.Post; }, function (post) { return post.author; }),
        tslib_1.__metadata("design:type", Array)
    ], PostAuthor.prototype, "posts", void 0);
    tslib_1.__decorate([
        BeforeInsert_1.BeforeInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostAuthor.prototype, "doSomethingBeforeInsertion", null);
    tslib_1.__decorate([
        AfterInsert_1.AfterInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostAuthor.prototype, "doSomethingAfterInsertion", null);
    tslib_1.__decorate([
        BeforeUpdate_1.BeforeUpdate(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostAuthor.prototype, "doSomethingBeforeUpdate", null);
    tslib_1.__decorate([
        AfterUpdate_1.AfterUpdate(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostAuthor.prototype, "doSomethingAfterUpdate", null);
    tslib_1.__decorate([
        BeforeRemove_1.BeforeRemove(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostAuthor.prototype, "doSomethingBeforeRemove", null);
    tslib_1.__decorate([
        AfterRemove_1.AfterRemove(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostAuthor.prototype, "doSomethingAfterRemove", null);
    PostAuthor = tslib_1.__decorate([
        index_1.Entity("sample9_post_author")
    ], PostAuthor);
    return PostAuthor;
}());
exports.PostAuthor = PostAuthor;
//# sourceMappingURL=PostAuthor.js.map