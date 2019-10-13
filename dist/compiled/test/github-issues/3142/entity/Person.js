"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var src_2 = require("../../../../src");
var src_3 = require("../../../../src");
var src_4 = require("../../../../src");
var Contact_1 = require("./Contact");
var Person = /** @class */ (function (_super) {
    tslib_1.__extends(Person, _super);
    function Person() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_3.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Person.prototype, "id", void 0);
    tslib_1.__decorate([
        src_2.Column(function (_type) { return Contact_1.Contact; }),
        tslib_1.__metadata("design:type", Contact_1.Contact)
    ], Person.prototype, "contact", void 0);
    tslib_1.__decorate([
        src_2.Column({ unique: true }),
        tslib_1.__metadata("design:type", String)
    ], Person.prototype, "status", void 0);
    Person = tslib_1.__decorate([
        src_4.Entity()
    ], Person);
    return Person;
}(src_1.BaseEntity));
exports.Person = Person;
//# sourceMappingURL=Person.js.map