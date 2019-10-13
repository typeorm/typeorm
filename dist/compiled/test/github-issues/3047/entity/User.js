"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Index_1 = require("../../../../src/decorator/Index");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: "varchar", length: 100 }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "first_name", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: "varchar", length: 100 }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "last_name", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: "varchar", length: 100 }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "is_updated", void 0);
    User = tslib_1.__decorate([
        Entity_1.Entity(),
        Index_1.Index("unique_idx", ["first_name", "last_name"], { unique: true })
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map