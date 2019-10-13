"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../src");
var src_2 = require("../../../../../src");
var src_3 = require("../../../../../src");
var src_4 = require("../../../../../src");
var src_5 = require("../../../../../src");
var Category_1 = require("./Category");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        src_3.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        src_2.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "name", void 0);
    tslib_1.__decorate([
        src_2.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "categoryId", void 0);
    tslib_1.__decorate([
        src_4.ManyToOne(function () { return Category_1.Category; }),
        src_5.JoinColumn({ name: "categoryId" }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "category", void 0);
    Post = tslib_1.__decorate([
        src_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map