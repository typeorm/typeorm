"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Duration = /** @class */ (function () {
    function Duration() {
    }
    tslib_1.__decorate([
        Column_1.Column({ type: Number, nullable: true }),
        tslib_1.__metadata("design:type", Object)
    ], Duration.prototype, "minutes", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: Number, nullable: true }),
        tslib_1.__metadata("design:type", Object)
    ], Duration.prototype, "hours", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: Number, nullable: true }),
        tslib_1.__metadata("design:type", Object)
    ], Duration.prototype, "days", void 0);
    return Duration;
}());
exports.Duration = Duration;
//# sourceMappingURL=Duration.js.map