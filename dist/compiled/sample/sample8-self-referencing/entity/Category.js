"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var ManyToOne_1 = require("../../../src/decorator/relations/ManyToOne");
var OneToMany_1 = require("../../../src/decorator/relations/OneToMany");
var OneToOne_1 = require("../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../src/decorator/relations/JoinColumn");
var JoinTable_1 = require("../../../src/decorator/relations/JoinTable");
var Category = /** @class */ (function () {
    function Category() {
        this.oneManyCategories = [];
        this.manyCategories = [];
        this.manyInverseCategories = [];
    }
    Category_1 = Category;
    var Category_1;
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "name", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Category_1; }, function (category) { return category.oneInverseCategory; }, {
            cascade: true
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Category)
    ], Category.prototype, "oneCategory", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Category_1; }, function (category) { return category.oneCategory; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", Category)
    ], Category.prototype, "oneInverseCategory", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Category_1; }, function (category) { return category.oneManyCategories; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", Category)
    ], Category.prototype, "oneManyCategory", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Category_1; }, function (category) { return category.oneManyCategory; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "oneManyCategories", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Category_1; }, function (category) { return category.manyInverseCategories; }, {
            cascade: true
        }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "manyCategories", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Category_1; }, function (category) { return category.manyCategories; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "manyInverseCategories", void 0);
    Category = Category_1 = tslib_1.__decorate([
        index_1.Entity("sample8_category")
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map