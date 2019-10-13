"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var src_1 = require("../../../../../src");
var PostCounter_1 = require("./PostCounter");
var PostInformation = /** @class */ (function () {
    function PostInformation() {
    }
    PostInformation.prototype.beforeInsert = function () {
        this.description = "default post description";
    };
    PostInformation.prototype.beforeUpdate = function () {
        this.description = "default post description";
    };
    tslib_1.__decorate([
        Column_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", String)
    ], PostInformation.prototype, "description", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return PostCounter_1.PostCounter; }, { prefix: "counters" }),
        tslib_1.__metadata("design:type", PostCounter_1.PostCounter)
    ], PostInformation.prototype, "counters", void 0);
    tslib_1.__decorate([
        src_1.BeforeInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostInformation.prototype, "beforeInsert", null);
    tslib_1.__decorate([
        src_1.BeforeUpdate(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostInformation.prototype, "beforeUpdate", null);
    return PostInformation;
}());
exports.PostInformation = PostInformation;
//# sourceMappingURL=PostInformation.js.map