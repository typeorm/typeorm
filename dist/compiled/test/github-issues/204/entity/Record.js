"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Record = /** @class */ (function () {
    function Record() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Record.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: "json" }),
        tslib_1.__metadata("design:type", Array)
    ], Record.prototype, "configs", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: "jsonb" }),
        tslib_1.__metadata("design:type", Array)
    ], Record.prototype, "datas", void 0);
    Record = tslib_1.__decorate([
        Entity_1.Entity()
    ], Record);
    return Record;
}());
exports.Record = Record;
//# sourceMappingURL=Record.js.map