"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var EditHistory_1 = require("./EditHistory");
var ExtraInformation = /** @class */ (function () {
    function ExtraInformation() {
    }
    tslib_1.__decorate([
        Column_1.Column(function (type) { return EditHistory_1.EditHistory; }),
        tslib_1.__metadata("design:type", EditHistory_1.EditHistory)
    ], ExtraInformation.prototype, "lastEdit", void 0);
    return ExtraInformation;
}());
exports.ExtraInformation = ExtraInformation;
//# sourceMappingURL=ExtraInformation.js.map