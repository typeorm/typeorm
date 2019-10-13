"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var PostMetadata = /** @class */ (function () {
    function PostMetadata() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostMetadata.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostMetadata.prototype, "description", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.metadatas; }),
        tslib_1.__metadata("design:type", Array)
    ], PostMetadata.prototype, "posts", void 0);
    PostMetadata = tslib_1.__decorate([
        index_1.Entity("sample4_post_metadata")
    ], PostMetadata);
    return PostMetadata;
}());
exports.PostMetadata = PostMetadata;
//# sourceMappingURL=PostMetadata.js.map