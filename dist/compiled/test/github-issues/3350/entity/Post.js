"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var Category_1 = require("./Category");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({ name: "category_id" }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "categoryId", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function () { return Category_1.Category; }),
        JoinColumn_1.JoinColumn({ name: "category_id" }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Post.prototype, "category", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map