"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Duration_1 = require("./Duration");
var Race = /** @class */ (function () {
    function Race() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Race.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Race.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return Duration_1.Duration; }),
        tslib_1.__metadata("design:type", Duration_1.Duration)
    ], Race.prototype, "duration", void 0);
    Race = tslib_1.__decorate([
        Entity_1.Entity()
    ], Race);
    return Race;
}());
exports.Race = Race;
//# sourceMappingURL=Race.js.map