"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Device = /** @class */ (function () {
    function Device() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn({
            name: "id",
            type: "char",
            length: "12"
        }),
        tslib_1.__metadata("design:type", String)
    ], Device.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({
            name: "registration_token",
            type: "decimal",
            precision: 6,
            scale: 0
        }),
        tslib_1.__metadata("design:type", String)
    ], Device.prototype, "registrationToken", void 0);
    Device = tslib_1.__decorate([
        Entity_1.Entity("devices")
    ], Device);
    return Device;
}());
exports.Device = Device;
//# sourceMappingURL=Device.js.map