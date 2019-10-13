"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var BaseEntity_1 = require("../../../../src/repository/BaseEntity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Category = /** @class */ (function (_super) {
    tslib_1.__extends(Category, _super);
    function Category() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "name", void 0);
    Category = tslib_1.__decorate([
        Entity_1.Entity()
    ], Category);
    return Category;
}(BaseEntity_1.BaseEntity));
exports.Category = Category;
//# sourceMappingURL=Category.js.map