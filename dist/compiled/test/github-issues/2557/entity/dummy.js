"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var transformer_1 = require("../transformer");
var Dummy = /** @class */ (function () {
    function Dummy() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Dummy.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column("int", { transformer: transformer_1.transformer }),
        tslib_1.__metadata("design:type", transformer_1.WrappedNumber)
    ], Dummy.prototype, "num", void 0);
    Dummy = tslib_1.__decorate([
        Entity_1.Entity()
    ], Dummy);
    return Dummy;
}());
exports.Dummy = Dummy;
//# sourceMappingURL=dummy.js.map