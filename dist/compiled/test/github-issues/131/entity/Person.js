"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var TableInheritance_1 = require("../../../../src/decorator/entity/TableInheritance");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
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
    ], Person.prototype, "name", void 0);
    Person = tslib_1.__decorate([
        Entity_1.Entity(),
        TableInheritance_1.TableInheritance({ column: { name: "type", type: "varchar" } })
    ], Person);
    return Person;
}());
exports.Person = Person;
//# sourceMappingURL=Person.js.map