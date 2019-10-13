"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var TreeLevelColumn_1 = require("../../../src/decorator/tree/TreeLevelColumn");
var TreeParent_1 = require("../../../src/decorator/tree/TreeParent");
var TreeChildren_1 = require("../../../src/decorator/tree/TreeChildren");
var Tree_1 = require("../../../src/decorator/tree/Tree");
var Entity_1 = require("../../../src/decorator/entity/Entity");
var Category = /** @class */ (function () {
    function Category() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "name", void 0);
    tslib_1.__decorate([
        TreeParent_1.TreeParent(),
        tslib_1.__metadata("design:type", Category)
    ], Category.prototype, "parentCategory", void 0);
    tslib_1.__decorate([
        TreeChildren_1.TreeChildren({ cascade: true }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "childCategories", void 0);
    tslib_1.__decorate([
        TreeLevelColumn_1.TreeLevelColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "level", void 0);
    Category = tslib_1.__decorate([
        Entity_1.Entity("sample22_category"),
        Tree_1.Tree("closure-table")
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map