"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var PostCategory_1 = require("./PostCategory");
var PostAuthor_1 = require("./PostAuthor");
var ManyToOne_1 = require("../../../src/decorator/relations/ManyToOne");
var AfterLoad_1 = require("../../../src/decorator/listeners/AfterLoad");
var AfterInsert_1 = require("../../../src/decorator/listeners/AfterInsert");
var BeforeInsert_1 = require("../../../src/decorator/listeners/BeforeInsert");
var BeforeUpdate_1 = require("../../../src/decorator/listeners/BeforeUpdate");
var AfterUpdate_1 = require("../../../src/decorator/listeners/AfterUpdate");
var BeforeRemove_1 = require("../../../src/decorator/listeners/BeforeRemove");
var AfterRemove_1 = require("../../../src/decorator/listeners/AfterRemove");
var JoinTable_1 = require("../../../src/decorator/relations/JoinTable");
var Post = /** @class */ (function () {
    function Post() {
        this.categories = [];
    }
    Post.prototype.generateRandomNumbers = function () {
        console.log("event: Post \"" + this.title + "\" entity has been loaded and callback executed");
        this.uid = Math.ceil(Math.random() * 1000);
    };
    Post.prototype.doSomethingBeforeInsertion = function () {
        console.log("event: Post entity will be inserted so soon...");
    };
    Post.prototype.doSomethingAfterInsertion = function () {
        console.log("event: Post entity has been inserted and callback executed");
    };
    Post.prototype.doSomethingBeforeUpdate = function () {
        console.log("event: Post entity will be updated so soon...");
    };
    Post.prototype.doSomethingAfterUpdate = function () {
        console.log("event: Post entity has been updated and callback executed");
    };
    Post.prototype.doSomethingBeforeRemove = function () {
        console.log("event: Post entity will be removed so soon...");
    };
    Post.prototype.doSomethingAfterRemove = function () {
        console.log("event: Post entity has been removed and callback executed");
    };
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
        ManyToOne_1.ManyToOne(function (type) { return PostAuthor_1.PostAuthor; }, function (post) { return post.posts; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", PostAuthor_1.PostAuthor)
    ], Post.prototype, "author", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return PostCategory_1.PostCategory; }, function (category) { return category.posts; }, {
            cascade: true
        }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categories", void 0);
    tslib_1.__decorate([
        AfterLoad_1.AfterLoad(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Post.prototype, "generateRandomNumbers", null);
    tslib_1.__decorate([
        BeforeInsert_1.BeforeInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Post.prototype, "doSomethingBeforeInsertion", null);
    tslib_1.__decorate([
        AfterInsert_1.AfterInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Post.prototype, "doSomethingAfterInsertion", null);
    tslib_1.__decorate([
        BeforeUpdate_1.BeforeUpdate(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Post.prototype, "doSomethingBeforeUpdate", null);
    tslib_1.__decorate([
        AfterUpdate_1.AfterUpdate(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Post.prototype, "doSomethingAfterUpdate", null);
    tslib_1.__decorate([
        BeforeRemove_1.BeforeRemove(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Post.prototype, "doSomethingBeforeRemove", null);
    tslib_1.__decorate([
        AfterRemove_1.AfterRemove(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Post.prototype, "doSomethingAfterRemove", null);
    Post = tslib_1.__decorate([
        index_1.Entity("sample9_post")
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map