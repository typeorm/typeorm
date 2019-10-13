"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var OneToOne_1 = require("../../../../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../../../../src/decorator/relations/JoinColumn");
var User_1 = require("./User");
var Person = /** @class */ (function () {
    function Person() {
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "fullName", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return User_1.User; }, { primary: true }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", User_1.User)
    ], Person.prototype, "user", void 0);
    Person = tslib_1.__decorate([
        Entity_1.Entity()
    ], Person);
    return Person;
}());
exports.Person = Person;
//# sourceMappingURL=Person.js.map