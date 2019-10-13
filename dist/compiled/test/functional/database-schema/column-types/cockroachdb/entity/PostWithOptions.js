"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../../src");
var src_2 = require("../../../../../../src");
var src_3 = require("../../../../../../src");
var PostWithOptions = /** @class */ (function () {
    function PostWithOptions() {
    }
    tslib_1.__decorate([
        src_2.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostWithOptions.prototype, "id", void 0);
    tslib_1.__decorate([
        src_3.Column("numeric", { precision: 5, scale: 2 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "numeric", void 0);
    tslib_1.__decorate([
        src_3.Column("decimal", { precision: 5, scale: 2 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "decimal", void 0);
    tslib_1.__decorate([
        src_3.Column("dec", { precision: 5, scale: 2 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "dec", void 0);
    tslib_1.__decorate([
        src_3.Column("char", { length: 3 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "char", void 0);
    tslib_1.__decorate([
        src_3.Column("character", { length: 3 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "character", void 0);
    tslib_1.__decorate([
        src_3.Column("varchar", { length: 30 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "varchar", void 0);
    tslib_1.__decorate([
        src_3.Column("character varying", { length: 30 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "characterVarying", void 0);
    tslib_1.__decorate([
        src_3.Column("char varying", { length: 30 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "charVarying", void 0);
    tslib_1.__decorate([
        src_3.Column("string", { length: 30 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "string", void 0);
    PostWithOptions = tslib_1.__decorate([
        src_1.Entity()
    ], PostWithOptions);
    return PostWithOptions;
}());
exports.PostWithOptions = PostWithOptions;
//# sourceMappingURL=PostWithOptions.js.map