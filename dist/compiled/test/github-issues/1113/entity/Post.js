"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.VersionColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "version", void 0);
    tslib_1.__decorate([
        src_1.CreateDateColumn({ type: "timestamp" }),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "createdAt", void 0);
    tslib_1.__decorate([
        src_1.UpdateDateColumn({ type: "timestamp" }),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "updatedAt", void 0);
    Post = tslib_1.__decorate([
        src_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map