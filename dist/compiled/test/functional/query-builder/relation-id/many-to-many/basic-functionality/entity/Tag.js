"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../../../src/decorator/columns/Column");
var Tag = /** @class */ (function () {
    function Tag() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Tag.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Tag.prototype, "name", void 0);
    Tag = tslib_1.__decorate([
        Entity_1.Entity()
    ], Tag);
    return Tag;
}());
exports.Tag = Tag;
//# sourceMappingURL=Tag.js.map