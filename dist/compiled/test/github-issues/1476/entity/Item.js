"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var Item = /** @class */ (function () {
    function Item() {
    }
    tslib_1.__decorate([
        index_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Item.prototype, "itemId", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Item.prototype, "planId", void 0);
    Item = tslib_1.__decorate([
        index_1.Entity()
    ], Item);
    return Item;
}());
exports.Item = Item;
//# sourceMappingURL=Item.js.map