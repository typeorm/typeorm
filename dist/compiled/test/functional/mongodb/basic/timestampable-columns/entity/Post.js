"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var ObjectIdColumn_1 = require("../../../../../../src/decorator/columns/ObjectIdColumn");
var typings_1 = require("../../../../../../src/driver/mongodb/typings");
var CreateDateColumn_1 = require("../../../../../../src/decorator/columns/CreateDateColumn");
var UpdateDateColumn_1 = require("../../../../../../src/decorator/columns/UpdateDateColumn");
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
    ], Post.prototype, "message", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        CreateDateColumn_1.CreateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "createdAt", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        UpdateDateColumn_1.UpdateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "updatedAt", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map