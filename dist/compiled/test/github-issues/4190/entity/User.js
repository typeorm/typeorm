"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Profile_1 = require("./Profile");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.OneToMany("Photo", "user"),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "photos", void 0);
    tslib_1.__decorate([
        src_1.OneToOne("Profile"),
        src_1.JoinColumn(),
        tslib_1.__metadata("design:type", Profile_1.Profile)
    ], User.prototype, "profile", void 0);
    User = tslib_1.__decorate([
        src_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map