"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var ObjectIdColumn_1 = require("../../../../../../src/decorator/columns/ObjectIdColumn");
var Index_1 = require("../../../../../../src/decorator/Index");
var typings_1 = require("../../../../../../src/driver/mongodb/typings");
var Information_1 = require("./Information");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        ObjectIdColumn_1.ObjectIdColumn(),
        tslib_1.__metadata("design:type", typings_1.ObjectID)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(function () { return Information_1.Information; }),
        tslib_1.__metadata("design:type", Information_1.Information)
    ], Post.prototype, "info", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity(),
        Index_1.Index("info_description", ["info.description"])
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map