"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Page = /** @class */ (function () {
    function Page() {
    }
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Page.prototype, "number", void 0);
    return Page;
}());
exports.Page = Page;
var Chapter = /** @class */ (function () {
    function Chapter() {
    }
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Chapter.prototype, "title", void 0);
    tslib_1.__decorate([
        src_1.Column(function (type) { return Page; }),
        tslib_1.__metadata("design:type", Array)
    ], Chapter.prototype, "pages", void 0);
    return Chapter;
}());
exports.Chapter = Chapter;
var Book = /** @class */ (function () {
    function Book() {
    }
    tslib_1.__decorate([
        src_1.ObjectIdColumn(),
        tslib_1.__metadata("design:type", src_1.ObjectID)
    ], Book.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Book.prototype, "title", void 0);
    tslib_1.__decorate([
        src_1.Column(function (type) { return Chapter; }),
        tslib_1.__metadata("design:type", Array)
    ], Book.prototype, "chapters", void 0);
    Book = tslib_1.__decorate([
        src_1.Entity()
    ], Book);
    return Book;
}());
exports.Book = Book;
//# sourceMappingURL=Book.js.map