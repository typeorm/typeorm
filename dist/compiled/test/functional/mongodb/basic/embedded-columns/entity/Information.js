"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var Information = /** @class */ (function () {
    function Information() {
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Information.prototype, "description", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], Information.prototype, "visible", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], Information.prototype, "editable", void 0);
    return Information;
}());
exports.Information = Information;
//# sourceMappingURL=Information.js.map