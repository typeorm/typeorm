"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Author_1 = require("./Author");
var ManyToOne_1 = require("../../../src/decorator/relations/ManyToOne");
var Category_1 = require("./Category");
var ManyToMany_1 = require("../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../src/decorator/relations/JoinTable");
var JoinColumn_1 = require("../../../src/decorator/relations/JoinColumn");
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
        ManyToOne_1.ManyToOne(function (type) { return Author_1.Author; }, function (author) { return author.posts; }, {
            cascade: true
        }),
        JoinColumn_1.JoinColumn({
            name: "user"
        }),
        tslib_1.__metadata("design:type", Author_1.Author)
    ], Post.prototype, "author", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.posts; }, {
            cascade: true
        }),
        JoinTable_1.JoinTable({
            name: "_post_categories"
        }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categories", void 0);
    Post = tslib_1.__decorate([
        index_1.Entity("sample21_post")
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map