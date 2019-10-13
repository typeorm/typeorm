"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var EmbeddedItem = /** @class */ (function () {
    function EmbeddedItem() {
    }
    tslib_1.__decorate([
        index_1.Column({ type: "integer", array: true }),
        tslib_1.__metadata("design:type", Array)
    ], EmbeddedItem.prototype, "arrayInsideEmbedded", void 0);
    return EmbeddedItem;
}());
exports.EmbeddedItem = EmbeddedItem;
var Item = /** @class */ (function () {
    function Item() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Item.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Item.prototype, "someText", void 0);
    tslib_1.__decorate([
        index_1.Column(function (type) { return EmbeddedItem; }),
        tslib_1.__metadata("design:type", EmbeddedItem)
    ], Item.prototype, "embedded", void 0);
    Item = tslib_1.__decorate([
        index_1.Entity()
    ], Item);
    return Item;
}());
exports.Item = Item;
//# sourceMappingURL=Item.js.map