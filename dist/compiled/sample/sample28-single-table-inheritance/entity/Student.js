"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../src/decorator/columns/Column");
var Person_1 = require("./Person");
var ChildEntity_1 = require("../../../src/decorator/entity/ChildEntity");
var Student = /** @class */ (function (_super) {
    tslib_1.__extends(Student, _super);
    function Student() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Student.prototype, "faculty", void 0);
    Student = tslib_1.__decorate([
        ChildEntity_1.ChildEntity()
    ], Student);
    return Student;
}(Person_1.Person));
exports.Student = Student;
//# sourceMappingURL=Student.js.map