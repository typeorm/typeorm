"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var User = /** @class */ (function () {
    function User() {
        this.id = undefined;
        this.email = "";
        this.avatarURL = "";
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Object)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column("varchar"),
        tslib_1.__metadata("design:type", Object)
    ], User.prototype, "email", void 0);
    tslib_1.__decorate([
        src_1.Column("varchar"),
        tslib_1.__metadata("design:type", Object)
    ], User.prototype, "avatarURL", void 0);
    User = tslib_1.__decorate([
        src_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map