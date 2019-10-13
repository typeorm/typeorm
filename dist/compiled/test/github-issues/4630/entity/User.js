"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Realm;
(function (Realm) {
    Realm["Blackrock"] = "Blackrock";
    Realm["KelThuzad"] = "Kel'Thuzad";
})(Realm = exports.Realm || (exports.Realm = {}));
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({ type: "enum", enum: Realm }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "realm", void 0);
    User = tslib_1.__decorate([
        src_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map