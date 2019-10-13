"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var ManyToMany_1 = require("../../../../src/decorator/relations/ManyToMany");
var TileEntity_1 = require("./TileEntity");
var ActivityEntity = /** @class */ (function () {
    function ActivityEntity() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn({ type: "bigint" }),
        tslib_1.__metadata("design:type", String)
    ], ActivityEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: "datetime" }),
        tslib_1.__metadata("design:type", Date)
    ], ActivityEntity.prototype, "endDate", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return TileEntity_1.TileEntity; }, function (tile) { return tile.activities; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", Array)
    ], ActivityEntity.prototype, "tiles", void 0);
    ActivityEntity = tslib_1.__decorate([
        Entity_1.Entity("activity")
    ], ActivityEntity);
    return ActivityEntity;
}());
exports.ActivityEntity = ActivityEntity;
//# sourceMappingURL=ActivityEntity.js.map