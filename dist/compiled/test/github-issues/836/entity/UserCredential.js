"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var OneToOne_1 = require("../../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var User_1 = require("./User");
var UserCredential = /** @class */ (function () {
    function UserCredential() {
    }
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function () { return User_1.User; }, {
            primary: true,
            cascade: true,
        }),
        JoinColumn_1.JoinColumn({
            name: "id",
            referencedColumnName: "id",
        }),
        tslib_1.__metadata("design:type", User_1.User)
    ], UserCredential.prototype, "user", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], UserCredential.prototype, "password", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], UserCredential.prototype, "salt", void 0);
    UserCredential = tslib_1.__decorate([
        Entity_1.Entity()
    ], UserCredential);
    return UserCredential;
}());
exports.UserCredential = UserCredential;
//# sourceMappingURL=UserCredential.js.map