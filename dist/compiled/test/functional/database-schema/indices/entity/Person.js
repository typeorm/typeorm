"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Index_1 = require("../../../../../src/decorator/Index");
var Person = /** @class */ (function () {
    function Person() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Person.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "firstname", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "lastname", void 0);
    Person = tslib_1.__decorate([
        Entity_1.Entity(),
        Index_1.Index("IDX_TEST", ["firstname", "lastname"])
    ], Person);
    return Person;
}());
exports.Person = Person;
//# sourceMappingURL=Person.js.map