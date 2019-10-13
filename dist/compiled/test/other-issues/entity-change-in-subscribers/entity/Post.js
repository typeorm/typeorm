"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var UpdateDateColumn_1 = require("../../../../src/decorator/columns/UpdateDateColumn");
var OneToOne_1 = require("../../../../src/decorator/relations/OneToOne");
var PostCategory_1 = require("./PostCategory");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var Post = /** @class */ (function () {
    function Post() {
        this.updatedColumns = 0;
        this.updatedRelations = 0;
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column({ default: false }),
        tslib_1.__metadata("design:type", Boolean)
    ], Post.prototype, "active", void 0);
    tslib_1.__decorate([
        UpdateDateColumn_1.UpdateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "updateDate", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return PostCategory_1.PostCategory; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", PostCategory_1.PostCategory)
    ], Post.prototype, "category", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "updatedColumns", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "updatedRelations", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map