"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ChildEntity_1 = require("../../../../../../../src/decorator/entity/ChildEntity");
var OneToMany_1 = require("../../../../../../../src/decorator/relations/OneToMany");
var Employee_1 = require("./Employee");
var Specialization_1 = require("./Specialization");
var Teacher = /** @class */ (function (_super) {
    tslib_1.__extends(Teacher, _super);
    function Teacher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Specialization_1.Specialization; }, function (specialization) { return specialization.teacher; }),
        tslib_1.__metadata("design:type", Array)
    ], Teacher.prototype, "specializations", void 0);
    Teacher = tslib_1.__decorate([
        ChildEntity_1.ChildEntity()
    ], Teacher);
    return Teacher;
}(Employee_1.Employee));
exports.Teacher = Teacher;
//# sourceMappingURL=Teacher.js.map