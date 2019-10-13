"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Repository_1 = require("../../../../../src/repository/Repository");
var EntityRepository_1 = require("../../../../../src/decorator/EntityRepository");
var Category_1 = require("../entity/Category");
var CategoryRepository = /** @class */ (function (_super) {
    tslib_1.__extends(CategoryRepository, _super);
    function CategoryRepository() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CategoryRepository.prototype.findByName = function (name) {
        return this.findOne({ name: name });
    };
    CategoryRepository = tslib_1.__decorate([
        EntityRepository_1.EntityRepository(Category_1.Category)
    ], CategoryRepository);
    return CategoryRepository;
}(Repository_1.Repository));
exports.CategoryRepository = CategoryRepository;
//# sourceMappingURL=CategoryRepository.js.map