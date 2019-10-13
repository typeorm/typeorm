"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../src");
var src_2 = require("../../../../../src");
var src_3 = require("../../../../../src");
var src_4 = require("../../../../../src");
var src_5 = require("../../../../../src");
var Person = /** @class */ (function () {
    function Person() {
    }
    tslib_1.__decorate([
        src_3.PrimaryGeneratedColumn("rowid"),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "id", void 0);
    tslib_1.__decorate([
        src_2.PrimaryColumn(),
        src_1.Generated("rowid"),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "id2", void 0);
    tslib_1.__decorate([
        src_2.PrimaryColumn({ generated: "rowid" }),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "id3", void 0);
    tslib_1.__decorate([
        src_5.Column({ generated: "rowid" }),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "id4", void 0);
    Person = tslib_1.__decorate([
        src_4.Entity()
    ], Person);
    return Person;
}());
exports.Person = Person;
//# sourceMappingURL=Person.js.map