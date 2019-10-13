"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Record = /** @class */ (function () {
    function Record() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Record.prototype, "id", void 0);
    Record = tslib_1.__decorate([
        Entity_1.Entity()
    ], Record);
    return Record;
}());
exports.Record = Record;
//# sourceMappingURL=Record.js.map