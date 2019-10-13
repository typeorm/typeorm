"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var ObjectIdColumn_1 = require("../../../../../../src/decorator/columns/ObjectIdColumn");
var Counters_1 = require("./Counters");
var typings_1 = require("../../../../../../src/driver/mongodb/typings");
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
        Column_1.Column(function (type) { return Counters_1.Counters; }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "counters", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "names", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "numbers", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "booleans", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return Counters_1.Counters; }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "other1", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return Counters_1.Counters; }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "other2", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map