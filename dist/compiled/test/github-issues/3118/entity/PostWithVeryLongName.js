"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var AuthorWithVeryLongName_1 = require("./AuthorWithVeryLongName");
var src_1 = require("../../../../src");
var CategoryWithVeryLongName_1 = require("./CategoryWithVeryLongName");
var PostWithVeryLongName = /** @class */ (function () {
    function PostWithVeryLongName() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostWithVeryLongName.prototype, "postId", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function () { return AuthorWithVeryLongName_1.AuthorWithVeryLongName; }, function (author) { return author.postsWithVeryLongName; }),
        tslib_1.__metadata("design:type", AuthorWithVeryLongName_1.AuthorWithVeryLongName)
    ], PostWithVeryLongName.prototype, "authorWithVeryLongName", void 0);
    tslib_1.__decorate([
        src_1.ManyToMany(function () { return CategoryWithVeryLongName_1.CategoryWithVeryLongName; }, function (category) { return category.postsWithVeryLongName; }),
        tslib_1.__metadata("design:type", Array)
    ], PostWithVeryLongName.prototype, "categories", void 0);
    PostWithVeryLongName = tslib_1.__decorate([
        src_1.Entity()
    ], PostWithVeryLongName);
    return PostWithVeryLongName;
}());
exports.PostWithVeryLongName = PostWithVeryLongName;
//# sourceMappingURL=PostWithVeryLongName.js.map