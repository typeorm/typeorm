"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var PostWithOptions = /** @class */ (function () {
    function PostWithOptions() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostWithOptions.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column("decimal", { precision: 10, scale: 5 }),
        tslib_1.__metadata("design:type", Number)
    ], PostWithOptions.prototype, "decimal", void 0);
    tslib_1.__decorate([
        Column_1.Column("dec", { precision: 10, scale: 5 }),
        tslib_1.__metadata("design:type", Number)
    ], PostWithOptions.prototype, "dec", void 0);
    tslib_1.__decorate([
        Column_1.Column("numeric", { precision: 10, scale: 5 }),
        tslib_1.__metadata("design:type", Number)
    ], PostWithOptions.prototype, "numeric", void 0);
    tslib_1.__decorate([
        Column_1.Column("char", { length: 3 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "char", void 0);
    tslib_1.__decorate([
        Column_1.Column("varchar", { length: 50 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "varchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("nchar", { length: 3 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "nchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("nvarchar", { length: 40 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "nvarchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("binary", { length: 5 }),
        tslib_1.__metadata("design:type", Buffer)
    ], PostWithOptions.prototype, "binary", void 0);
    tslib_1.__decorate([
        Column_1.Column("varbinary", { length: 5 }),
        tslib_1.__metadata("design:type", Buffer)
    ], PostWithOptions.prototype, "varbinary", void 0);
    tslib_1.__decorate([
        Column_1.Column("datetime2", { precision: 4 }),
        tslib_1.__metadata("design:type", Date)
    ], PostWithOptions.prototype, "datetime2", void 0);
    tslib_1.__decorate([
        Column_1.Column("time", { precision: 5 }),
        tslib_1.__metadata("design:type", Date)
    ], PostWithOptions.prototype, "time", void 0);
    tslib_1.__decorate([
        Column_1.Column("datetimeoffset", { precision: 6 }),
        tslib_1.__metadata("design:type", Date)
    ], PostWithOptions.prototype, "datetimeoffset", void 0);
    PostWithOptions = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostWithOptions);
    return PostWithOptions;
}());
exports.PostWithOptions = PostWithOptions;
//# sourceMappingURL=PostWithOptions.js.map