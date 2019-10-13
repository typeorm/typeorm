"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var User = /** @class */ (function () {
    function User(user) {
        if (user) {
            this.name = user.name;
        }
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "name", void 0);
    User = tslib_1.__decorate([
        index_1.Entity(),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map