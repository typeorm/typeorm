"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src/");
var note_1 = require("./note");
var Person = /** @class */ (function () {
    function Person() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Person.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function (type) { return note_1.Note; }, function (note) { return note.owner; }, { lazy: true }),
        tslib_1.__metadata("design:type", Object)
    ], Person.prototype, "notes", void 0);
    Person = tslib_1.__decorate([
        src_1.Entity()
    ], Person);
    return Person;
}());
exports.Person = Person;
//# sourceMappingURL=person.js.map