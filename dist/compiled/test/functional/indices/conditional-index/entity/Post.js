"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../src");
var Index_1 = require("../../../../../src/decorator/Index");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        Index_1.Index({ where: "\"version\" IS NOT NULL AND \"version\" > 0" }),
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "version", void 0);
    Post = tslib_1.__decorate([
        Index_1.Index(["name", "text"], { where: "\"name\" IS NOT NULL AND \"text\" IS NOT NULL" }),
        src_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map