"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Index_1 = require("../../../../src/decorator/Index");
var Group = /** @class */ (function () {
    function Group() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Group.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Group.prototype, "name", void 0);
    Group = tslib_1.__decorate([
        Index_1.Index("Groups name", ["name"], { unique: true }),
        Entity_1.Entity("groups")
    ], Group);
    return Group;
}());
exports.Group = Group;
//# sourceMappingURL=Group.js.map