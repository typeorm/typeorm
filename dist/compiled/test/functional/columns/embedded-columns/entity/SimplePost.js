"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var SimpleCounters_1 = require("./SimpleCounters");
var SimplePost = /** @class */ (function () {
    function SimplePost() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], SimplePost.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], SimplePost.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], SimplePost.prototype, "text", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return SimpleCounters_1.SimpleCounters; }),
        tslib_1.__metadata("design:type", SimpleCounters_1.SimpleCounters)
    ], SimplePost.prototype, "counters", void 0);
    SimplePost = tslib_1.__decorate([
        Entity_1.Entity()
    ], SimplePost);
    return SimplePost;
}());
exports.SimplePost = SimplePost;
//# sourceMappingURL=SimplePost.js.map