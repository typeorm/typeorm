"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Flight = /** @class */ (function () {
    function Flight(id, date) {
        this.id = id;
        this.date = date;
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Flight.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column("timestamp with time zone"),
        tslib_1.__metadata("design:type", Date)
    ], Flight.prototype, "date", void 0);
    Flight = tslib_1.__decorate([
        Entity_1.Entity(),
        tslib_1.__metadata("design:paramtypes", [Number, Date])
    ], Flight);
    return Flight;
}());
exports.Flight = Flight;
//# sourceMappingURL=Flight.js.map