"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var OneToOne_1 = require("../../../../../src/decorator/relations/OneToOne");
var Category_1 = require("./Category");
var CategoryMetadata = /** @class */ (function () {
    function CategoryMetadata() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], CategoryMetadata.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], CategoryMetadata.prototype, "keyword", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }, function (category) { return category.metadata; }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], CategoryMetadata.prototype, "category", void 0);
    CategoryMetadata = tslib_1.__decorate([
        Entity_1.Entity()
    ], CategoryMetadata);
    return CategoryMetadata;
}());
exports.CategoryMetadata = CategoryMetadata;
//# sourceMappingURL=CategoryMetadata.js.map