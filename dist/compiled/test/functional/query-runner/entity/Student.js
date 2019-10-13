"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Faculty_1 = require("./Faculty");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var Teacher_1 = require("./Teacher");
var Index_1 = require("../../../../src/decorator/Index");
var Student = /** @class */ (function () {
    function Student() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Student.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Student.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Faculty_1.Faculty; }),
        tslib_1.__metadata("design:type", Faculty_1.Faculty)
    ], Student.prototype, "faculty", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Teacher_1.Teacher; }),
        tslib_1.__metadata("design:type", Teacher_1.Teacher)
    ], Student.prototype, "teacher", void 0);
    Student = tslib_1.__decorate([
        Entity_1.Entity(),
        Index_1.Index("student_name_index", ["name"])
    ], Student);
    return Student;
}());
exports.Student = Student;
//# sourceMappingURL=Student.js.map