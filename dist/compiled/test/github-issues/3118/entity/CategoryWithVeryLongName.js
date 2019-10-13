"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var PostWithVeryLongName_1 = require("./PostWithVeryLongName");
var CategoryWithVeryLongName = /** @class */ (function () {
    function CategoryWithVeryLongName() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], CategoryWithVeryLongName.prototype, "categoryId", void 0);
    tslib_1.__decorate([
        src_1.ManyToMany(function () { return PostWithVeryLongName_1.PostWithVeryLongName; }, function (post) { return post.categories; }),
        src_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], CategoryWithVeryLongName.prototype, "postsWithVeryLongName", void 0);
    CategoryWithVeryLongName = tslib_1.__decorate([
        src_1.Entity()
    ], CategoryWithVeryLongName);
    return CategoryWithVeryLongName;
}());
exports.CategoryWithVeryLongName = CategoryWithVeryLongName;
//# sourceMappingURL=CategoryWithVeryLongName.js.map