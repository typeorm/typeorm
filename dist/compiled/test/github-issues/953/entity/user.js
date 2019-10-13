"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({
            length: 32,
            unique: true
        }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "username", void 0);
    tslib_1.__decorate([
        Column_1.Column({
            nullable: true
        }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "password", void 0);
    tslib_1.__decorate([
        Column_1.Column({
            nullable: true
        }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "phone", void 0);
    tslib_1.__decorate([
        Column_1.Column("json"),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "roles", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Date)
    ], User.prototype, "lastLoginAt", void 0);
    User = tslib_1.__decorate([
        Entity_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=user.js.map