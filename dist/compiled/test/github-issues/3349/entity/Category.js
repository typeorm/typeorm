"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var src_2 = require("../../../../src");
var src_3 = require("../../../../src");
var Category = /** @class */ (function () {
    function Category() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        src_2.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "myField", void 0);
    Category = tslib_1.__decorate([
        src_3.Entity()
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map