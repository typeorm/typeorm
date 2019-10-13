"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var Plan = /** @class */ (function () {
    function Plan() {
    }
    tslib_1.__decorate([
        index_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Plan.prototype, "planId", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Plan.prototype, "planName", void 0);
    Plan = tslib_1.__decorate([
        index_1.Entity()
    ], Plan);
    return Plan;
}());
exports.Plan = Plan;
//# sourceMappingURL=Plan.js.map