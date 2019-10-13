"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column("character", {
            length: 50
        }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "character", void 0);
    tslib_1.__decorate([
        Column_1.Column("varchar", {
            length: 50
        }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "varchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("varying character", {
            length: 50
        }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "varying_character", void 0);
    tslib_1.__decorate([
        Column_1.Column("nchar", {
            length: 50
        }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "nchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("native character", {
            length: 50
        }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "native_character", void 0);
    tslib_1.__decorate([
        Column_1.Column("nvarchar", {
            length: 50
        }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "nvarchar", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map