"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var JoinTable_1 = require("../../../../src/decorator/relations/JoinTable");
var Category_1 = require("./Category");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn({ collation: "utf8_unicode_ci", charset: "utf8" }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.posts; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categories", void 0);
    Post = tslib_1.__decorate([
        src_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map