"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var OneToMany_1 = require("../../../src/decorator/relations/OneToMany");
var PostUser_1 = require("./PostUser");
var PostAuthor = /** @class */ (function (_super) {
    tslib_1.__extends(PostAuthor, _super);
    function PostAuthor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostAuthor.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostAuthor.prototype, "name", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Post_1.Post; }, function (post) { return post.author; }),
        tslib_1.__metadata("design:type", Array)
    ], PostAuthor.prototype, "posts", void 0);
    PostAuthor = tslib_1.__decorate([
        index_1.Entity("sample13_post_author")
    ], PostAuthor);
    return PostAuthor;
}(PostUser_1.PostUser));
exports.PostAuthor = PostAuthor;
//# sourceMappingURL=PostAuthor.js.map