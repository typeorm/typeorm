"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var Category_1 = require("./Category");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var Animal = /** @class */ (function () {
    function Animal() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Animal.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Animal.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function () { return Category_1.Category; }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Animal.prototype, "category", void 0);
    Animal = tslib_1.__decorate([
        index_1.Entity()
    ], Animal);
    return Animal;
}());
exports.Animal = Animal;
//# sourceMappingURL=Animal.js.map