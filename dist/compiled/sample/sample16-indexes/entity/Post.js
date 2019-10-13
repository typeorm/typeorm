"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Index_1 = require("../../../src/decorator/Index");
var BasePost_1 = require("./BasePost");
var Post = /** @class */ (function (_super) {
    tslib_1.__extends(Post, _super);
    function Post() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        index_1.Column(),
        Index_1.Index(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        index_1.Column({ unique: true }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        Index_1.Index(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "likesCount", void 0);
    Post = tslib_1.__decorate([
        index_1.Entity("sample16_post"),
        Index_1.Index("my_index_with_id_and_title", function (post) { return [post.id, post.title]; })
    ], Post);
    return Post;
}(BasePost_1.BasePost));
exports.Post = Post;
//# sourceMappingURL=Post.js.map