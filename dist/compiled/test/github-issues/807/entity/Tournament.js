"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Tournament = /** @class */ (function () {
    function Tournament() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Tournament.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({ unique: true, length: 200 }),
        tslib_1.__metadata("design:type", String)
    ], Tournament.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Date)
    ], Tournament.prototype, "startDate", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Date)
    ], Tournament.prototype, "endDate", void 0);
    Tournament = tslib_1.__decorate([
        Entity_1.Entity()
    ], Tournament);
    return Tournament;
}());
exports.Tournament = Tournament;
//# sourceMappingURL=Tournament.js.map