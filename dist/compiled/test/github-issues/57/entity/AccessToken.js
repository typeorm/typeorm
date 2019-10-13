"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var OneToOne_1 = require("../../../../src/decorator/relations/OneToOne");
var User_1 = require("./User");
var Generated_1 = require("../../../../src/decorator/Generated");
var AccessToken = /** @class */ (function () {
    function AccessToken() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn("int"),
        Generated_1.Generated(),
        tslib_1.__metadata("design:type", Number)
    ], AccessToken.prototype, "primaryKey", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return User_1.User; }, function (user) { return user.access_token; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", User_1.User)
    ], AccessToken.prototype, "user", void 0);
    AccessToken = tslib_1.__decorate([
        Entity_1.Entity()
    ], AccessToken);
    return AccessToken;
}());
exports.AccessToken = AccessToken;
//# sourceMappingURL=AccessToken.js.map