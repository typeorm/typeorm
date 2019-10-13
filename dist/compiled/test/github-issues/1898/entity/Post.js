"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Post = /** @class */ (function (_super) {
    tslib_1.__extends(Post, _super);
    function Post() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "type", void 0);
    tslib_1.__decorate([
        Column_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "token", void 0);
    tslib_1.__decorate([
        Column_1.Column("simple-json", { default: "{}" }),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "values", void 0);
    tslib_1.__decorate([
        src_1.CreateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "createdAt", void 0);
    tslib_1.__decorate([
        src_1.UpdateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "updatedAt", void 0);
    Post = tslib_1.__decorate([
        src_1.Entity()
    ], Post);
    return Post;
}(src_1.BaseEntity));
exports.Post = Post;
//# sourceMappingURL=Post.js.map