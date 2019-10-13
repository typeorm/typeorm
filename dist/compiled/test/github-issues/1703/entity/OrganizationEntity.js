"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var UserToOrganizationEntity_1 = require("./UserToOrganizationEntity");
var OrganizationEntity = /** @class */ (function () {
    function OrganizationEntity() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], OrganizationEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function (type) { return UserToOrganizationEntity_1.UserToOrganizationEntity; }, function (userToOrganization) { return userToOrganization.organization; }),
        tslib_1.__metadata("design:type", Array)
    ], OrganizationEntity.prototype, "users", void 0);
    OrganizationEntity = tslib_1.__decorate([
        src_1.Entity("organizations")
    ], OrganizationEntity);
    return OrganizationEntity;
}());
exports.OrganizationEntity = OrganizationEntity;
//# sourceMappingURL=OrganizationEntity.js.map