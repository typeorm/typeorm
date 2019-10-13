"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var Index_1 = require("../../../../../src/decorator/Index");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Profile_1 = require("./Profile");
var Customer = /** @class */ (function () {
    function Customer() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Customer.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Customer.prototype, "nameHebrew", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Customer.prototype, "nameEnglish", void 0);
    tslib_1.__decorate([
        Column_1.Column(function () { return Profile_1.Profile; }),
        tslib_1.__metadata("design:type", Profile_1.Profile)
    ], Customer.prototype, "profile", void 0);
    Customer = tslib_1.__decorate([
        Entity_1.Entity(),
        Index_1.Index("index_name_english", ["nameEnglish"], { unique: true }),
        Index_1.Index("index_profile_job", ["profile.job"])
    ], Customer);
    return Customer;
}());
exports.Customer = Customer;
//# sourceMappingURL=Customer.js.map