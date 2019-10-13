"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ChildEntity_1 = require("../../../../../../../src/decorator/entity/ChildEntity");
var OneToMany_1 = require("../../../../../../../src/decorator/relations/OneToMany");
var Employee_1 = require("./Employee");
var Department_1 = require("./Department");
var Accountant = /** @class */ (function (_super) {
    tslib_1.__extends(Accountant, _super);
    function Accountant() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Department_1.Department; }, function (department) { return department.accountant; }),
        tslib_1.__metadata("design:type", Array)
    ], Accountant.prototype, "departments", void 0);
    Accountant = tslib_1.__decorate([
        ChildEntity_1.ChildEntity()
    ], Accountant);
    return Accountant;
}(Employee_1.Employee));
exports.Accountant = Accountant;
//# sourceMappingURL=Accountant.js.map