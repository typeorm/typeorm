"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var ManyToMany_1 = require("../../../src/decorator/relations/ManyToMany");
var Category_1 = require("./Category");
var JoinTable_1 = require("../../../src/decorator/relations/JoinTable");
var Post = /** @class */ (function () {
    function Post(title, text, categories) {
        this.title = title;
        this.text = text;
        this.categories = categories;
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
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categories", void 0);
    Post = tslib_1.__decorate([
        index_1.Entity("sample30_post", {
            orderBy: {
                title: "ASC",
                id: "DESC"
            }
        }),
        tslib_1.__metadata("design:paramtypes", [String, String, Array])
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map