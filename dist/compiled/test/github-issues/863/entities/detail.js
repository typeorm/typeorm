"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Index_1 = require("../../../../src/decorator/Index");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var master_1 = require("./master");
var Detail = /** @class */ (function () {
    function Detail() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn({
            length: 20
        }),
        tslib_1.__metadata("design:type", String)
    ], Detail.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({
            nullable: false,
            length: 20
        }),
        tslib_1.__metadata("design:type", String)
    ], Detail.prototype, "masterId", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return master_1.Master; }, function (master) { return master.details; }, {
            nullable: false,
            onDelete: "CASCADE"
        }),
        JoinColumn_1.JoinColumn({
            name: "masterId"
        }),
        tslib_1.__metadata("design:type", master_1.Master)
    ], Detail.prototype, "master", void 0);
    Detail = tslib_1.__decorate([
        Entity_1.Entity(),
        Index_1.Index("IDX_UNQ_MasterId", function (type) { return [type.masterId]; }, { unique: true })
    ], Detail);
    return Detail;
}());
exports.Detail = Detail;
//# sourceMappingURL=detail.js.map