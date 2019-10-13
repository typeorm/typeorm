"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Product = /** @class */ (function () {
    function Product(name, label, price) {
        this.name = name;
        this.label = label;
        this.price = price;
    }
    tslib_1.__decorate([
        src_1.ObjectIdColumn(),
        tslib_1.__metadata("design:type", src_1.ObjectID)
    ], Product.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Product.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Product.prototype, "label", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Product.prototype, "price", void 0);
    Product = tslib_1.__decorate([
        src_1.Entity(),
        tslib_1.__metadata("design:paramtypes", [String, String, Number])
    ], Product);
    return Product;
}());
exports.Product = Product;
//# sourceMappingURL=Product.js.map