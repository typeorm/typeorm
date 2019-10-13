"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Profile_1 = require("./Profile");
var OneToOne_1 = require("../../../../../../src/decorator/relations/OneToOne");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Profile_1.Profile; }, function (profile) { return profile.user; }, { cascade: ["insert"] }),
        tslib_1.__metadata("design:type", Profile_1.Profile)
    ], User.prototype, "profile", void 0);
    User = tslib_1.__decorate([
        Entity_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map