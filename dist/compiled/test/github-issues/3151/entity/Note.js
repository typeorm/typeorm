"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var src_2 = require("../../../../src");
var src_3 = require("../../../../src");
var src_4 = require("../../../../src");
var src_5 = require("../../../../src");
var Category_1 = require("./Category");
var Note = /** @class */ (function () {
    function Note() {
    }
    tslib_1.__decorate([
        src_2.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Note.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Note.prototype, "content", void 0);
    tslib_1.__decorate([
        src_5.ManyToMany(function (type) { return Category_1.Category; }, function (category) { return category.notes; }),
        src_4.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Note.prototype, "categories", void 0);
    Note = tslib_1.__decorate([
        src_3.Entity()
    ], Note);
    return Note;
}());
exports.Note = Note;
//# sourceMappingURL=Note.js.map