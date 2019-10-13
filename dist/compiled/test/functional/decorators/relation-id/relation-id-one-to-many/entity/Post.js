"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var ManyToOne_1 = require("../../../../../../src/decorator/relations/ManyToOne");
var Category_1 = require("./Category");
var Post = /** @class */ (function () {
    function Post() {
        this.isRemoved = false;
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], Post.prototype, "isRemoved", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1.Category; }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "category", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map