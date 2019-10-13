"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Information = /** @class */ (function () {
    function Information() {
    }
    tslib_1.__decorate([
        Column_1.Column({ name: "descr" }),
        tslib_1.__metadata("design:type", String)
    ], Information.prototype, "description", void 0);
    return Information;
}());
exports.Information = Information;
//# sourceMappingURL=Information.js.map