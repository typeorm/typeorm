"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../../src");
var Person_1 = require("./Person");
var Employee = /** @class */ (function (_super) {
    tslib_1.__extends(Employee, _super);
    function Employee() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Employee.prototype, "salary", void 0);
    Employee = tslib_1.__decorate([
        src_1.ChildEntity()
    ], Employee);
    return Employee;
}(Person_1.Person));
exports.Employee = Employee;
//# sourceMappingURL=Employee.js.map