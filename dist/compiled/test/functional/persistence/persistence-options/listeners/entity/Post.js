"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var BeforeInsert_1 = require("../../../../../../src/decorator/listeners/BeforeInsert");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var AfterRemove_1 = require("../../../../../../src/decorator/listeners/AfterRemove");
var Post = /** @class */ (function () {
    function Post() {
        this.isRemoved = false;
    }
    Post.prototype.beforeInsert = function () {
        this.title += "!";
    };
    Post.prototype.afterRemove = function () {
        this.isRemoved = true;
    };
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "description", void 0);
    tslib_1.__decorate([
        BeforeInsert_1.BeforeInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Post.prototype, "beforeInsert", null);
    tslib_1.__decorate([
        AfterRemove_1.AfterRemove(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Post.prototype, "afterRemove", null);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map