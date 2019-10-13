"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var src_2 = require("../../../../src");
var src_3 = require("../../../../src");
var src_4 = require("../../../../src");
var src_5 = require("../../../../src");
var src_6 = require("../../../../src");
var Category = /** @class */ (function () {
    function Category() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        src_2.Column(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "name", void 0);
    tslib_1.__decorate([
        src_3.TreeParent(),
        tslib_1.__metadata("design:type", Category)
    ], Category.prototype, "parentCategory", void 0);
    tslib_1.__decorate([
        src_4.TreeChildren({ cascade: true }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "childCategories", void 0);
    Category = tslib_1.__decorate([
        src_5.Entity(),
        src_6.Tree("closure-table")
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map