"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ViewColumn_1 = require("../../../../../src/decorator/columns/ViewColumn");
var ViewEntity_1 = require("../../../../../src/decorator/entity-view/ViewEntity");
var PostCategory = /** @class */ (function () {
    function PostCategory() {
    }
    tslib_1.__decorate([
        ViewColumn_1.ViewColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostCategory.prototype, "id", void 0);
    tslib_1.__decorate([
        ViewColumn_1.ViewColumn(),
        tslib_1.__metadata("design:type", String)
    ], PostCategory.prototype, "name", void 0);
    tslib_1.__decorate([
        ViewColumn_1.ViewColumn(),
        tslib_1.__metadata("design:type", String)
    ], PostCategory.prototype, "categoryName", void 0);
    PostCategory = tslib_1.__decorate([
        ViewEntity_1.ViewEntity({ expression: "\n    SELECT `post`.`id` `id`, `post`.`name` AS `name`, `category`.`name` AS `categoryName`\n    FROM `post` `post`\n    LEFT JOIN `category` `category` ON `post`.`categoryId` = `category`.`id`\n" })
    ], PostCategory);
    return PostCategory;
}());
exports.PostCategory = PostCategory;
//# sourceMappingURL=PostCategory.js.map