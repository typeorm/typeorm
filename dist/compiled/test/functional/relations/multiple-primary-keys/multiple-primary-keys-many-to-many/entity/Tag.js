"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var ManyToMany_1 = require("../../../../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../../../../src/decorator/relations/JoinTable");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Category_1 = require("./Category");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var Tag = /** @class */ (function () {
    function Tag() {
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Tag.prototype, "code", void 0);
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], Tag.prototype, "title", void 0);
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], Tag.prototype, "description", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.tags; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Tag.prototype, "categories", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.tagsWithOptions; }),
        JoinTable_1.JoinTable({
            name: "tag_categories",
            joinColumns: [{
                    name: "tagTitle",
                    referencedColumnName: "title"
                }, {
                    name: "tagDescription",
                    referencedColumnName: "description"
                }],
            inverseJoinColumns: [{
                    name: "categoryName",
                    referencedColumnName: "name"
                }, {
                    name: "categoryType",
                    referencedColumnName: "type"
                }]
        }),
        tslib_1.__metadata("design:type", Array)
    ], Tag.prototype, "categoriesWithOptions", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.tagsWithNonPKColumns; }),
        JoinTable_1.JoinTable({
            name: "tag_categories_non_primary",
            joinColumns: [{
                    name: "tagTitle",
                    referencedColumnName: "title"
                }, {
                    name: "tagDescription",
                    referencedColumnName: "description"
                }],
            inverseJoinColumns: [{
                    name: "categoryCode",
                    referencedColumnName: "code"
                }, {
                    name: "categoryVersion",
                    referencedColumnName: "version"
                }, {
                    name: "categoryDescription",
                    referencedColumnName: "description"
                }]
        }),
        tslib_1.__metadata("design:type", Array)
    ], Tag.prototype, "categoriesWithNonPKColumns", void 0);
    Tag = tslib_1.__decorate([
        Entity_1.Entity()
    ], Tag);
    return Tag;
}());
exports.Tag = Tag;
//# sourceMappingURL=Tag.js.map