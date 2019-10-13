"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var src_1 = require("../../../../../../src");
var Information = /** @class */ (function () {
    function Information() {
    }
    Information.prototype.beforeInsert = function () {
        this.description = "description afterLoad";
    };
    Information.prototype.afterLoad = function () {
        this.comments = 1;
    };
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Information.prototype, "description", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Information.prototype, "comments", void 0);
    tslib_1.__decorate([
        src_1.BeforeInsert(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Information.prototype, "beforeInsert", null);
    tslib_1.__decorate([
        src_1.AfterLoad(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", void 0)
    ], Information.prototype, "afterLoad", null);
    return Information;
}());
exports.Information = Information;
//# sourceMappingURL=Information.js.map