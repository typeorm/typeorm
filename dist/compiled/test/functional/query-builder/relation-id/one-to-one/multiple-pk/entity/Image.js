"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../../../src/decorator/columns/Column");
var OneToOne_1 = require("../../../../../../../src/decorator/relations/OneToOne");
var Category_1 = require("./Category");
var Image = /** @class */ (function () {
    function Image() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Image.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Image.prototype, "name", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }, function (category) { return category.image; }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Image.prototype, "category", void 0);
    Image = tslib_1.__decorate([
        Entity_1.Entity()
    ], Image);
    return Image;
}());
exports.Image = Image;
//# sourceMappingURL=Image.js.map