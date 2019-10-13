"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var src_1 = require("../../../../src");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Post_1 = require("./Post");
var PostVersion = /** @class */ (function () {
    function PostVersion() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostVersion.prototype, "id", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Post_1.Post; }),
        src_1.JoinColumn({ referencedColumnName: "version" }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], PostVersion.prototype, "post", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostVersion.prototype, "details", void 0);
    PostVersion = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostVersion);
    return PostVersion;
}());
exports.PostVersion = PostVersion;
//# sourceMappingURL=PostVersion.js.map