"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Parent_1 = require("./Parent");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var Child = /** @class */ (function () {
    function Child() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Child.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Child.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (target) { return Parent_1.Parent; }, function (parent) { return parent.id; }, { lazy: true }),
        tslib_1.__metadata("design:type", Object)
    ], Child.prototype, "parent", void 0);
    Child = tslib_1.__decorate([
        Entity_1.Entity()
    ], Child);
    return Child;
}());
exports.Child = Child;
//# sourceMappingURL=Child.js.map