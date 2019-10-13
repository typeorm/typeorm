"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../../src/decorator/columns/Column");
var Entity_1 = require("../../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var ManyToOne_1 = require("../../../../../../../src/decorator/relations/ManyToOne");
var Accountant_1 = require("./Accountant");
var Department = /** @class */ (function () {
    function Department() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Department.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Department.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Accountant_1.Accountant; }, function (accountant) { return accountant.departments; }),
        tslib_1.__metadata("design:type", Accountant_1.Accountant)
    ], Department.prototype, "accountant", void 0);
    Department = tslib_1.__decorate([
        Entity_1.Entity()
    ], Department);
    return Department;
}());
exports.Department = Department;
//# sourceMappingURL=Department.js.map