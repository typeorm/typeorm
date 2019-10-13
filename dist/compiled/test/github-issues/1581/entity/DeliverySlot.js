"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var DeliverySlot = /** @class */ (function () {
    function DeliverySlot() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], DeliverySlot.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], DeliverySlot.prototype, "name", void 0);
    DeliverySlot = tslib_1.__decorate([
        src_1.Entity()
    ], DeliverySlot);
    return DeliverySlot;
}());
exports.DeliverySlot = DeliverySlot;
//# sourceMappingURL=DeliverySlot.js.map