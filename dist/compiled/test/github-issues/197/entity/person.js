"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Index_1 = require("../../../../src/decorator/Index");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Person = /** @class */ (function () {
    function Person() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Person.prototype, "id", void 0);
    tslib_1.__decorate([
        Index_1.Index({
            unique: true
        }),
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "firstname", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "lastname", void 0);
    Person = tslib_1.__decorate([
        Entity_1.Entity()
    ], Person);
    return Person;
}());
exports.Person = Person;
//# sourceMappingURL=person.js.map