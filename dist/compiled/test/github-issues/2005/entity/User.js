"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "tinyint",
            transformer: {
                from: function (val) { return !!val; },
                to: function (val) { return val; },
            },
        }),
        tslib_1.__metadata("design:type", Boolean)
    ], User.prototype, "activated", void 0);
    User = tslib_1.__decorate([
        src_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map