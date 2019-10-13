"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Tree_1 = require("../../../../src/decorator/tree/Tree");
var TreeChildren_1 = require("../../../../src/decorator/tree/TreeChildren");
var TreeParent_1 = require("../../../../src/decorator/tree/TreeParent");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        TreeParent_1.TreeParent(),
        tslib_1.__metadata("design:type", User)
    ], User.prototype, "manager", void 0);
    tslib_1.__decorate([
        TreeChildren_1.TreeChildren(),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "managerOf", void 0);
    User = tslib_1.__decorate([
        Entity_1.Entity({ name: "users", schema: "admin" }),
        Tree_1.Tree("nested-set")
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map