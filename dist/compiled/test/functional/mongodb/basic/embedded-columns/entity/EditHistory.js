"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var EditHistory = /** @class */ (function () {
    function EditHistory() {
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], EditHistory.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], EditHistory.prototype, "text", void 0);
    return EditHistory;
}());
exports.EditHistory = EditHistory;
//# sourceMappingURL=EditHistory.js.map