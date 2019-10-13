"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Unique_1 = require("../../../../src/decorator/Unique");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Check_1 = require("../../../../src/decorator/Check");
var Exclusion_1 = require("../../../../src/decorator/Exclusion");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({ unique: true }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "version", void 0);
    tslib_1.__decorate([
        Column_1.Column({ default: "My post" }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "tag", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity(),
        Unique_1.Unique(["text", "tag"]),
        Exclusion_1.Exclusion("USING gist (\"name\" WITH =)"),
        Check_1.Check("\"version\" < 999")
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map