"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var OneToOne_1 = require("../../../../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../../../../src/decorator/relations/JoinColumn");
var Category_1 = require("./Category");
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
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }, function (category) { return category.tag; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Tag.prototype, "category", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }, function (category) { return category.tagWithOptions; }),
        JoinColumn_1.JoinColumn([
            { name: "category_name", referencedColumnName: "name" },
            { name: "category_type", referencedColumnName: "type" }
        ]),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Tag.prototype, "categoryWithOptions", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }, function (category) { return category.tagWithNonPKColumns; }),
        JoinColumn_1.JoinColumn([
            { name: "category_code", referencedColumnName: "code" },
            { name: "category_version", referencedColumnName: "version" },
            { name: "category_description", referencedColumnName: "description" }
        ]),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Tag.prototype, "categoryWithNonPKColumns", void 0);
    Tag = tslib_1.__decorate([
        Entity_1.Entity()
    ], Tag);
    return Tag;
}());
exports.Tag = Tag;
//# sourceMappingURL=Tag.js.map