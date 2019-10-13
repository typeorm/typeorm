"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var UserToOrganizationEntity_1 = require("./UserToOrganizationEntity");
var UserEntity = /** @class */ (function () {
    function UserEntity() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], UserEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function (type) { return UserToOrganizationEntity_1.UserToOrganizationEntity; }, function (userToOrganization) { return userToOrganization.user; }),
        tslib_1.__metadata("design:type", Array)
    ], UserEntity.prototype, "organizations", void 0);
    UserEntity = tslib_1.__decorate([
        src_1.Entity("user")
    ], UserEntity);
    return UserEntity;
}());
exports.UserEntity = UserEntity;
//# sourceMappingURL=UserEntity.js.map