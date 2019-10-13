"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Person = /** @class */ (function () {
    function Person() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Person.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column("varchar"),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "name", void 0);
    Person = tslib_1.__decorate([
        src_1.Entity({ schema: "custom" }),
        src_1.TableInheritance({ column: { type: "varchar", name: "type" } })
    ], Person);
    return Person;
}());
exports.Person = Person;
//# sourceMappingURL=Person.js.map