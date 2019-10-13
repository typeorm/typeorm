"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Category_1 = require("./Category");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var OneToOne_1 = require("../../../../src/decorator/relations/OneToOne");
var PostMetadata_1 = require("./PostMetadata");
var Post = /** @class */ (function () {
    function Post() {
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
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }, { cascade: true }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "category", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return PostMetadata_1.PostMetadata; }, function (metadata) { return metadata.post; }, { cascade: true }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "metadata", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map