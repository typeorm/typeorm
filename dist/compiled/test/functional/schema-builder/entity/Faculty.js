"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Faculty = /** @class */ (function () {
    function Faculty() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Faculty.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Faculty.prototype, "name", void 0);
    Faculty = tslib_1.__decorate([
        Entity_1.Entity()
    ], Faculty);
    return Faculty;
}());
exports.Faculty = Faculty;
//# sourceMappingURL=Faculty.js.map