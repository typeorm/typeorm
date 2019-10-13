"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var Cover = /** @class */ (function () {
    function Cover() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Cover.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Cover.prototype, "url", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return Post_1.Post; }, function (post) { return post.cover; }),
        tslib_1.__metadata("design:type", Array)
    ], Cover.prototype, "posts", void 0);
    Cover = tslib_1.__decorate([
        index_1.Entity("sample10_cover")
    ], Cover);
    return Cover;
}());
exports.Cover = Cover;
//# sourceMappingURL=Cover.js.map