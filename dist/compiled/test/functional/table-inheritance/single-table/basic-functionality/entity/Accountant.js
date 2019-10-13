"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var ChildEntity_1 = require("../../../../../../src/decorator/entity/ChildEntity");
var Employee_1 = require("./Employee");
var Accountant = /** @class */ (function (_super) {
    tslib_1.__extends(Accountant, _super);
    function Accountant() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Accountant.prototype, "department", void 0);
    Accountant = tslib_1.__decorate([
        ChildEntity_1.ChildEntity()
    ], Accountant);
    return Accountant;
}(Employee_1.Employee));
exports.Accountant = Accountant;
//# sourceMappingURL=Accountant.js.map