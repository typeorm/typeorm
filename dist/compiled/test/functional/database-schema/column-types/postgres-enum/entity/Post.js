"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var src_1 = require("../../../../../../src");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column("enum", { enum: ["A", "B", "C"] }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "enum", void 0);
    tslib_1.__decorate([
        Column_1.Column("simple-enum", { enum: ["A", "B", "C"] }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "simpleEnum", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "name", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map