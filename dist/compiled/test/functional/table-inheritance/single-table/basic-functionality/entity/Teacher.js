"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var ChildEntity_1 = require("../../../../../../src/decorator/entity/ChildEntity");
var Employee_1 = require("./Employee");
var Teacher = /** @class */ (function (_super) {
    tslib_1.__extends(Teacher, _super);
    function Teacher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Teacher.prototype, "specialization", void 0);
    Teacher = tslib_1.__decorate([
        ChildEntity_1.ChildEntity()
    ], Teacher);
    return Teacher;
}(Employee_1.Employee));
exports.Teacher = Teacher;
//# sourceMappingURL=Teacher.js.map