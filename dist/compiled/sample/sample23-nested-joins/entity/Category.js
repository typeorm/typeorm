"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Author_1 = require("./Author");
var ManyToMany_1 = require("../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../src/decorator/relations/JoinTable");
var Category = /** @class */ (function () {
    function Category() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Author_1.Author; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Author_1.Author)
    ], Category.prototype, "author", void 0);
    Category = tslib_1.__decorate([
        index_1.Entity("sample23_category")
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map