"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var UserEntity_1 = require("./UserEntity");
var OrganizationEntity_1 = require("./OrganizationEntity");
var UserToOrganizationEntity = /** @class */ (function () {
    function UserToOrganizationEntity() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], UserToOrganizationEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "enum",
            enum: [
                "owner",
                "editor",
                "viewer"
            ]
        }),
        tslib_1.__metadata("design:type", String)
    ], UserToOrganizationEntity.prototype, "role", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return UserEntity_1.UserEntity; }, function (user) { return user.organizations; }),
        tslib_1.__metadata("design:type", UserEntity_1.UserEntity)
    ], UserToOrganizationEntity.prototype, "user", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return OrganizationEntity_1.OrganizationEntity; }, function (organization) { return organization.users; }),
        tslib_1.__metadata("design:type", OrganizationEntity_1.OrganizationEntity)
    ], UserToOrganizationEntity.prototype, "organization", void 0);
    UserToOrganizationEntity = tslib_1.__decorate([
        src_1.Entity("user_organization")
    ], UserToOrganizationEntity);
    return UserToOrganizationEntity;
}());
exports.UserToOrganizationEntity = UserToOrganizationEntity;
//# sourceMappingURL=UserToOrganizationEntity.js.map