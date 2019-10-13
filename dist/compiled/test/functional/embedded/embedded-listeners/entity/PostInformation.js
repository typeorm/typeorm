"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var PostCounter_1 = require("./PostCounter");
var BeforeInsert_1 = require("../../../../../src/decorator/listeners/BeforeInsert");
var Index_1 = require("../../../../../src/decorator/Index");
var PostInformation = /** @class */ (function () {
    function PostInformation() {
        this.counters = new PostCounter_1.PostCounter();
    }
    PostInformation.prototype.beforeInsert = function () {
        this.description = "default post description";
    };
    tslib_1.__decorate([
        Column_1.Column(),
        Index_1.Index(),
        tslib_1.__metadata("design:type", String)
    ], PostInformation.prototype, "description", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return PostCounter_1.PostCounter; }, { prefix: "counters" }),
        tslib_1.__metadata("design:type", PostCounter_1.PostCounter)
    ], PostInformation.prototype, "counters", void 0);
    tslib_1.__decorate([
        BeforeInsert_1.BeforeInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostInformation.prototype, "beforeInsert", null);
    return PostInformation;
}());
exports.PostInformation = PostInformation;
//# sourceMappingURL=PostInformation.js.map