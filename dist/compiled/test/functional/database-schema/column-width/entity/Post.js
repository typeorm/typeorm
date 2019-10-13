"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column("int", { width: 10 }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "int", void 0);
    tslib_1.__decorate([
        Column_1.Column("tinyint", { width: 2 }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "tinyint", void 0);
    tslib_1.__decorate([
        Column_1.Column("smallint", { width: 3 }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "smallint", void 0);
    tslib_1.__decorate([
        Column_1.Column("mediumint", { width: 9 }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "mediumint", void 0);
    tslib_1.__decorate([
        Column_1.Column("bigint", { width: 10 }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "bigint", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map