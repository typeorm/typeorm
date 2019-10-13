"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ChildEntity_1 = require("../../../../../../../src/decorator/entity/ChildEntity");
var ManyToMany_1 = require("../../../../../../../src/decorator/relations/ManyToMany");
var Person_1 = require("./Person");
var Faculty_1 = require("./Faculty");
var JoinTable_1 = require("../../../../../../../src/decorator/relations/JoinTable");
var Student = /** @class */ (function (_super) {
    tslib_1.__extends(Student, _super);
    function Student() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Faculty_1.Faculty; }, function (faculty) { return faculty.students; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Student.prototype, "faculties", void 0);
    Student = tslib_1.__decorate([
        ChildEntity_1.ChildEntity()
    ], Student);
    return Student;
}(Person_1.Person));
exports.Student = Student;
//# sourceMappingURL=Student.js.map