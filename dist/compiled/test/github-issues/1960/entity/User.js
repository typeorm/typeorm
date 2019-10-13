"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var src_2 = require("../../../../src");
var src_3 = require("../../../../src");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        src_2.PrimaryGeneratedColumn("increment"),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column("varchar"),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.Column("time"),
        tslib_1.__metadata("design:type", Date)
    ], User.prototype, "time", void 0);
    tslib_1.__decorate([
        src_1.Column("timestamp"),
        tslib_1.__metadata("design:type", Date)
    ], User.prototype, "timestamp", void 0);
    tslib_1.__decorate([
        src_1.Column("datetime"),
        tslib_1.__metadata("design:type", Date)
    ], User.prototype, "date1", void 0);
    tslib_1.__decorate([
        src_1.Column("datetime", { nullable: true }),
        tslib_1.__metadata("design:type", Date)
    ], User.prototype, "date2", void 0);
    User = tslib_1.__decorate([
        src_3.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map