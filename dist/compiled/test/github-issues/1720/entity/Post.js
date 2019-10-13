"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Category_1 = require("./Category");
var Post = /** @class */ (function () {
    function Post() {
    }
    Object.defineProperty(Post.prototype, "categories", {
        get: function () {
            return this._categories;
        },
        set: function (arr) {
            this._categories = arr;
        },
        enumerable: true,
        configurable: true
    });
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        src_1.ManyToMany(function () { return Category_1.Category; }),
        src_1.JoinTable(),
        tslib_1.__metadata("design:type", Object),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], Post.prototype, "categories", null);
    Post = tslib_1.__decorate([
        src_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map