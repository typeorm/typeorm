"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Child_1 = require("./Child");
var OneToMany_1 = require("../../../../src/decorator/relations/OneToMany");
var Parent = /** @class */ (function () {
    function Parent() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Parent.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Parent.prototype, "name", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (target) { return Child_1.Child; }, function (child) { return child.parent; }, { lazy: true }),
        tslib_1.__metadata("design:type", Promise)
    ], Parent.prototype, "children", void 0);
    Parent = tslib_1.__decorate([
        Entity_1.Entity()
    ], Parent);
    return Parent;
}());
exports.Parent = Parent;
//# sourceMappingURL=Parent.js.map