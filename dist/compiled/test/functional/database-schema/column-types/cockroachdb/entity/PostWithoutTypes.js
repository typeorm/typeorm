"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../../src");
var src_2 = require("../../../../../../src");
var src_3 = require("../../../../../../src");
var PostWithoutTypes = /** @class */ (function () {
    function PostWithoutTypes() {
    }
    tslib_1.__decorate([
        src_2.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostWithoutTypes.prototype, "id", void 0);
    tslib_1.__decorate([
        src_3.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostWithoutTypes.prototype, "name", void 0);
    tslib_1.__decorate([
        src_3.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], PostWithoutTypes.prototype, "boolean", void 0);
    tslib_1.__decorate([
        src_3.Column(),
        tslib_1.__metadata("design:type", Date)
    ], PostWithoutTypes.prototype, "datetime", void 0);
    PostWithoutTypes = tslib_1.__decorate([
        src_1.Entity()
    ], PostWithoutTypes);
    return PostWithoutTypes;
}());
exports.PostWithoutTypes = PostWithoutTypes;
//# sourceMappingURL=PostWithoutTypes.js.map