"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ChildEntity_1 = require("../../../../../../../src/decorator/entity/ChildEntity");
var OneToMany_1 = require("../../../../../../../src/decorator/relations/OneToMany");
var Person_1 = require("./Person");
var Faculty_1 = require("./Faculty");
var Student = /** @class */ (function (_super) {
    tslib_1.__extends(Student, _super);
    function Student() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Faculty_1.Faculty; }, function (faculty) { return faculty.student; }),
        tslib_1.__metadata("design:type", Array)
    ], Student.prototype, "faculties", void 0);
    Student = tslib_1.__decorate([
        ChildEntity_1.ChildEntity()
    ], Student);
    return Student;
}(Person_1.Person));
exports.Student = Student;
//# sourceMappingURL=Student.js.map