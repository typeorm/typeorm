"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var User_1 = require("./User");
var Photo_1 = require("./Photo");
var OneToOne_1 = require("../../../../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../../../../src/decorator/relations/JoinColumn");
var Profile = /** @class */ (function () {
    function Profile() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Profile.prototype, "id", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return User_1.User; }, function (user) { return user.profile; }, {
            nullable: false
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", User_1.User)
    ], Profile.prototype, "user", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Photo_1.Photo; }, {
            nullable: false,
            cascade: ["insert"]
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Photo_1.Photo)
    ], Profile.prototype, "photo", void 0);
    Profile = tslib_1.__decorate([
        Entity_1.Entity()
    ], Profile);
    return Profile;
}());
exports.Profile = Profile;
//# sourceMappingURL=Profile.js.map