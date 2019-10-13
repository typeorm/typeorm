"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Person_1 = require("./Person");
var ChildEntity_1 = require("../../../../src/decorator/entity/ChildEntity");
var Employee = /** @class */ (function (_super) {
    tslib_1.__extends(Employee, _super);
    function Employee() {
        var _this = _super.call(this) || this;
        _this.type = 1;
        return _this;
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Employee.prototype, "salary", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Employee.prototype, "shared", void 0);
    Employee = tslib_1.__decorate([
        ChildEntity_1.ChildEntity(Person_1.PersonType.Employee),
        tslib_1.__metadata("design:paramtypes", [])
    ], Employee);
    return Employee;
}(Person_1.Person));
exports.Employee = Employee;
//# sourceMappingURL=Employee.js.map