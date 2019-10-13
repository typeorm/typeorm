"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var BeforeInsert_1 = require("../../../../../src/decorator/listeners/BeforeInsert");
var BeforeUpdate_1 = require("../../../../../src/decorator/listeners/BeforeUpdate");
var PostCounter = /** @class */ (function () {
    function PostCounter() {
    }
    PostCounter.prototype.beforeInsert = function () {
        this.likes = 0;
    };
    PostCounter.prototype.beforeUpdate = function () {
        this.likes++;
    };
    tslib_1.__decorate([
        Column_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", Number)
    ], PostCounter.prototype, "likes", void 0);
    tslib_1.__decorate([
        BeforeInsert_1.BeforeInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostCounter.prototype, "beforeInsert", null);
    tslib_1.__decorate([
        BeforeUpdate_1.BeforeUpdate(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], PostCounter.prototype, "beforeUpdate", null);
    return PostCounter;
}());
exports.PostCounter = PostCounter;
//# sourceMappingURL=PostCounter.js.map