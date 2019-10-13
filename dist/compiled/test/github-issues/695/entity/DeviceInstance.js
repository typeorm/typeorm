"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Device_1 = require("./Device");
var DeviceInstance = /** @class */ (function () {
    function DeviceInstance() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn({ name: "id", type: "char", length: "36" }),
        tslib_1.__metadata("design:type", String)
    ], DeviceInstance.prototype, "id", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Device_1.Device; }, { nullable: false }),
        JoinColumn_1.JoinColumn({ name: "device_id", referencedColumnName: "id" }),
        tslib_1.__metadata("design:type", Device_1.Device)
    ], DeviceInstance.prototype, "device", void 0);
    tslib_1.__decorate([
        Column_1.Column({ name: "instance", type: "smallint" }),
        tslib_1.__metadata("design:type", Number)
    ], DeviceInstance.prototype, "instance", void 0);
    tslib_1.__decorate([
        Column_1.Column({ name: "type", type: "varchar", length: "30" }),
        tslib_1.__metadata("design:type", String)
    ], DeviceInstance.prototype, "type", void 0);
    DeviceInstance = tslib_1.__decorate([
        Entity_1.Entity("device_instances")
    ], DeviceInstance);
    return DeviceInstance;
}());
exports.DeviceInstance = DeviceInstance;
//# sourceMappingURL=DeviceInstance.js.map