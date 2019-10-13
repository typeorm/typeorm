"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Profile_1 = require("./Profile");
var Information_1 = require("./Information");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Date)
    ], User.prototype, "registeredAt", void 0);
    tslib_1.__decorate([
        Column_1.Column("json"),
        tslib_1.__metadata("design:type", Profile_1.Profile)
    ], User.prototype, "profile", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return Information_1.Information; }),
        tslib_1.__metadata("design:type", Information_1.Information)
    ], User.prototype, "information", void 0);
    User = tslib_1.__decorate([
        Entity_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map