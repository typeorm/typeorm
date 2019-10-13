"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var PostAuthor_1 = require("./PostAuthor");
var JoinColumn_1 = require("../../../src/decorator/relations/JoinColumn");
var OneToMany_1 = require("../../../src/decorator/relations/OneToMany");
var JoinTable_1 = require("../../../src/decorator/relations/JoinTable");
var ManyToMany_1 = require("../../../src/decorator/relations/ManyToMany");
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
        index_1.OneToOne(function (type) { return PostAuthor_1.PostAuthor; }, function (author) { return author.post; }, {
            cascade: true
        }),
        JoinColumn_1.JoinColumn() // comment this and you'll get an error because JoinColumn must be at least on one side of the one-to-one relationship
        ,
        tslib_1.__metadata("design:type", PostAuthor_1.PostAuthor)
    ], Post.prototype, "author", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return PostAuthor_1.PostAuthor; }, function (author) { return author.editedPost; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "editors", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return PostAuthor_1.PostAuthor; }, function (author) { return author.manyPosts; }),
        JoinTable_1.JoinTable() // comment this and you'll get an error because JoinTable must be at least on one side of the many-to-many relationship
        ,
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "manyAuthors", void 0);
    Post = tslib_1.__decorate([
        index_1.Entity("sample14_post")
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map