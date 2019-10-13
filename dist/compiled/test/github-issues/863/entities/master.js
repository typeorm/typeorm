"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var OneToMany_1 = require("../../../../src/decorator/relations/OneToMany");
var detail_1 = require("./detail");
var Master = /** @class */ (function () {
    function Master() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn({
            length: 20
        }),
        tslib_1.__metadata("design:type", String)
    ], Master.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({
            nullable: false,
            length: 150
        }),
        tslib_1.__metadata("design:type", String)
    ], Master.prototype, "description", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return detail_1.Detail; }, function (detail) { return detail.master; }),
        tslib_1.__metadata("design:type", Array)
    ], Master.prototype, "details", void 0);
    Master = tslib_1.__decorate([
        Entity_1.Entity()
    ], Master);
    return Master;
}());
exports.Master = Master;
//# sourceMappingURL=master.js.map