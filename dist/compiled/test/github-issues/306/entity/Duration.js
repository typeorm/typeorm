"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Duration = /** @class */ (function () {
    function Duration() {
    }
    tslib_1.__decorate([
        Column_1.Column({ name: "duration_minutes" }),
        tslib_1.__metadata("design:type", Number)
    ], Duration.prototype, "durationMinutes", void 0);
    tslib_1.__decorate([
        Column_1.Column({ name: "duration_hours" }),
        tslib_1.__metadata("design:type", Number)
    ], Duration.prototype, "durationHours", void 0);
    tslib_1.__decorate([
        Column_1.Column({ name: "duration_days" }),
        tslib_1.__metadata("design:type", Number)
    ], Duration.prototype, "durationDays", void 0);
    return Duration;
}());
exports.Duration = Duration;
//# sourceMappingURL=Duration.js.map