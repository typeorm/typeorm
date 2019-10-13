"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var OneToOne_1 = require("../../../../../../src/decorator/relations/OneToOne");
var User_1 = require("./User");
var Profile = /** @class */ (function () {
    function Profile() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Profile.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Profile.prototype, "about", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return User_1.User; }, function (user) { return user.profile; }, { eager: true }),
        tslib_1.__metadata("design:type", User_1.User)
    ], Profile.prototype, "user", void 0);
    Profile = tslib_1.__decorate([
        Entity_1.Entity()
    ], Profile);
    return Profile;
}());
exports.Profile = Profile;
//# sourceMappingURL=Profile.js.map