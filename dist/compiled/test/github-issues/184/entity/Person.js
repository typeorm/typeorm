"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var TableInheritance_1 = require("../../../../src/decorator/entity/TableInheritance");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var PersonType;
(function (PersonType) {
    PersonType[PersonType["Employee"] = 1] = "Employee";
    PersonType[PersonType["Homesitter"] = 2] = "Homesitter";
    PersonType[PersonType["Student"] = 3] = "Student";
})(PersonType = exports.PersonType || (exports.PersonType = {}));
var Person = /** @class */ (function () {
    function Person() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "firstName", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "lastName", void 0);
    Person = tslib_1.__decorate([
        Entity_1.Entity("issue184_person"),
        TableInheritance_1.TableInheritance({ column: { name: "type", type: "int" } })
    ], Person);
    return Person;
}());
exports.Person = Person;
//# sourceMappingURL=Person.js.map