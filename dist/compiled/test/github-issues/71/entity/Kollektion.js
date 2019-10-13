"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Generated_1 = require("../../../../src/decorator/Generated");
var Kollektion = /** @class */ (function () {
    function Kollektion() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn("int", { name: "kollektion_id" }),
        Generated_1.Generated(),
        tslib_1.__metadata("design:type", Number)
    ], Kollektion.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({ name: "kollektion_name" }),
        tslib_1.__metadata("design:type", String)
    ], Kollektion.prototype, "name", void 0);
    Kollektion = tslib_1.__decorate([
        Entity_1.Entity("kollektion")
    ], Kollektion);
    return Kollektion;
}());
exports.Kollektion = Kollektion;
//# sourceMappingURL=Kollektion.js.map