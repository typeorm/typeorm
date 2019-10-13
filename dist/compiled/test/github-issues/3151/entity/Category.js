"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var src_2 = require("../../../../src");
var src_3 = require("../../../../src");
var src_4 = require("../../../../src");
var Note_1 = require("./Note");
var Category = /** @class */ (function () {
    function Category() {
    }
    tslib_1.__decorate([
        src_2.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "name", void 0);
    tslib_1.__decorate([
        src_4.ManyToMany(function (type) { return Note_1.Note; }, function (note) { return note.categories; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "notes", void 0);
    Category = tslib_1.__decorate([
        src_3.Entity()
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map