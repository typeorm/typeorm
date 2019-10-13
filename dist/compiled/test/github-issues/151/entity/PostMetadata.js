"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var OneToOne_1 = require("../../../../src/decorator/relations/OneToOne");
var Post_1 = require("./Post");
var PostMetadata = /** @class */ (function () {
    function PostMetadata() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostMetadata.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostMetadata.prototype, "name", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Post_1.Post; }, function (post) { return post.metadata; }),
        tslib_1.__metadata("design:type", Object)
    ], PostMetadata.prototype, "post", void 0);
    PostMetadata = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostMetadata);
    return PostMetadata;
}());
exports.PostMetadata = PostMetadata;
//# sourceMappingURL=PostMetadata.js.map