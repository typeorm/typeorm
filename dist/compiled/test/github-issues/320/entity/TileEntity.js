"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var ManyToMany_1 = require("../../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../../src/decorator/relations/JoinTable");
var ActivityEntity_1 = require("./ActivityEntity");
var TileEntity = /** @class */ (function () {
    function TileEntity() {
    }
    TileEntity_1 = TileEntity;
    var TileEntity_1;
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn({ type: "bigint" }),
        tslib_1.__metadata("design:type", String)
    ], TileEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return TileEntity_1; }, function (tile) { return tile.children; }, {
            cascade: ["insert"]
        }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], TileEntity.prototype, "parents", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return TileEntity_1; }, function (tile) { return tile.parents; }, {
            cascade: ["insert"]
        }),
        tslib_1.__metadata("design:type", Array)
    ], TileEntity.prototype, "children", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return ActivityEntity_1.ActivityEntity; }, function (activity) { return activity.tiles; }, {
            cascade: ["insert"]
        }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], TileEntity.prototype, "activities", void 0);
    TileEntity = TileEntity_1 = tslib_1.__decorate([
        Entity_1.Entity("tile")
    ], TileEntity);
    return TileEntity;
}());
exports.TileEntity = TileEntity;
//# sourceMappingURL=TileEntity.js.map