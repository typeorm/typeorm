"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var EventRole_1 = require("./EventRole");
var src_1 = require("../../../../src");
var Role = /** @class */ (function () {
    function Role() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Role.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Role.prototype, "title", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function (type) { return EventRole_1.EventRole; }, function (role) { return role.role; }),
        tslib_1.__metadata("design:type", Array)
    ], Role.prototype, "roles", void 0);
    Role = tslib_1.__decorate([
        index_1.Entity()
    ], Role);
    return Role;
}());
exports.Role = Role;
//# sourceMappingURL=Role.js.map