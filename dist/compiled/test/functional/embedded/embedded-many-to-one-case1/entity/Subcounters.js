"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Subcounters = /** @class */ (function () {
    function Subcounters() {
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Subcounters.prototype, "version", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Subcounters.prototype, "watches", void 0);
    return Subcounters;
}());
exports.Subcounters = Subcounters;
//# sourceMappingURL=Subcounters.js.map