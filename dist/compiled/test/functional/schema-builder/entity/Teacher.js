"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Student_1 = require("./Student");
var OneToMany_1 = require("../../../../src/decorator/relations/OneToMany");
var Index_1 = require("../../../../src/decorator/Index");
var Teacher = /** @class */ (function () {
    function Teacher() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Teacher.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Teacher.prototype, "name", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Student_1.Student; }, function (student) { return student.teacher; }),
        tslib_1.__metadata("design:type", Array)
    ], Teacher.prototype, "students", void 0);
    Teacher = tslib_1.__decorate([
        Entity_1.Entity(),
        Index_1.Index("ignored_index", { synchronize: false })
    ], Teacher);
    return Teacher;
}());
exports.Teacher = Teacher;
//# sourceMappingURL=Teacher.js.map