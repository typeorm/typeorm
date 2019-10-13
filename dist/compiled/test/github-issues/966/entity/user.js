"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var PersonalInfo = /** @class */ (function () {
    function PersonalInfo() {
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PersonalInfo.prototype, "firstName", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PersonalInfo.prototype, "lastName", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PersonalInfo.prototype, "address", void 0);
    return PersonalInfo;
}());
exports.PersonalInfo = PersonalInfo;
var UserInfo = /** @class */ (function (_super) {
    tslib_1.__extends(UserInfo, _super);
    function UserInfo() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], UserInfo.prototype, "userName", void 0);
    return UserInfo;
}(PersonalInfo));
exports.UserInfo = UserInfo;
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return UserInfo; }),
        tslib_1.__metadata("design:type", UserInfo)
    ], User.prototype, "info", void 0);
    User = tslib_1.__decorate([
        Entity_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=user.js.map