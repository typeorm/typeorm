"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../src/decorator/columns/Column");
var TableInheritance_1 = require("../../../src/decorator/entity/TableInheritance");
var Entity_1 = require("../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../src/decorator/columns/PrimaryColumn");
// todo: some things left to do:
// * check how it works when is join (conditions are not added in the joins right now)
var Person = /** @class */ (function () {
    function Person() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn("int"),
        tslib_1.__metadata("design:type", Number)
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
        Entity_1.Entity("sample28_person"),
        TableInheritance_1.TableInheritance({ column: { name: "type", type: "varchar" } })
    ], Person);
    return Person;
}());
exports.Person = Person;
//# sourceMappingURL=Person.js.map