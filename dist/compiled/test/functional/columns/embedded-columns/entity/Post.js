"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Counters_1 = require("./Counters");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return Counters_1.Counters; }),
        tslib_1.__metadata("design:type", Counters_1.Counters)
    ], Post.prototype, "counters", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return Counters_1.Counters; }, { prefix: "testCounters" }),
        tslib_1.__metadata("design:type", Counters_1.Counters)
    ], Post.prototype, "otherCounters", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return Counters_1.Counters; }, { prefix: "" }),
        tslib_1.__metadata("design:type", Counters_1.Counters)
    ], Post.prototype, "countersWithoutPrefix", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map