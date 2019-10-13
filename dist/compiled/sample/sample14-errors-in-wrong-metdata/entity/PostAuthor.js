"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var ManyToOne_1 = require("../../../src/decorator/relations/ManyToOne");
var ManyToMany_1 = require("../../../src/decorator/relations/ManyToMany");
var PostAuthor = /** @class */ (function () {
    function PostAuthor() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostAuthor.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostAuthor.prototype, "name", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return Post_1.Post; }, function (post) { return post.author; }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], PostAuthor.prototype, "post", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Post_1.Post; }, function (post) { return post.editors; }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], PostAuthor.prototype, "editedPost", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.manyAuthors; }),
        tslib_1.__metadata("design:type", Array)
    ], PostAuthor.prototype, "manyPosts", void 0);
    PostAuthor = tslib_1.__decorate([
        index_1.Entity("sample14_post_author")
    ], PostAuthor);
    return PostAuthor;
}());
exports.PostAuthor = PostAuthor;
//# sourceMappingURL=PostAuthor.js.map