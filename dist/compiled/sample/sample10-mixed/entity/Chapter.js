"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var PostDetails_1 = require("./PostDetails");
var Chapter = /** @class */ (function () {
    function Chapter() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Chapter.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Chapter.prototype, "about", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return PostDetails_1.PostDetails; }, function (postDetails) { return postDetails.chapter; }),
        tslib_1.__metadata("design:type", Array)
    ], Chapter.prototype, "postDetails", void 0);
    Chapter = tslib_1.__decorate([
        index_1.Entity("sample10_chapter")
    ], Chapter);
    return Chapter;
}());
exports.Chapter = Chapter;
//# sourceMappingURL=Chapter.js.map