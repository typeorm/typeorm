"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var User = /** @class */ (function () {
    function User() {
    }
    User_1 = User;
    var User_1;
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "key", void 0);
    tslib_1.__decorate([
        src_1.Column({ name: "client_id" }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "clientId", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.Column({ name: "updated_by" }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "updatedById", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return User_1; }),
        src_1.JoinColumn([{ name: "client_id", referencedColumnName: "clientId" }, { name: "updated_by", referencedColumnName: "key" }]),
        tslib_1.__metadata("design:type", Promise)
    ], User.prototype, "updatedBy", void 0);
    User = User_1 = tslib_1.__decorate([
        src_1.Entity(),
        src_1.Unique(["clientId", "key"])
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map