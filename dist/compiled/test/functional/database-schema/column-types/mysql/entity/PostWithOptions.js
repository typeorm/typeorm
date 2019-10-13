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
        Column_1.Column({ length: 10 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column("float", { precision: 5, scale: 2 }),
        tslib_1.__metadata("design:type", Number)
    ], PostWithOptions.prototype, "float", void 0);
    tslib_1.__decorate([
        Column_1.Column("double", { precision: 5, scale: 2 }),
        tslib_1.__metadata("design:type", Number)
    ], PostWithOptions.prototype, "double", void 0);
    tslib_1.__decorate([
        Column_1.Column("decimal", { precision: 7, scale: 2 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "decimal", void 0);
    tslib_1.__decorate([
        Column_1.Column("char", { length: 5 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "char", void 0);
    tslib_1.__decorate([
        Column_1.Column("varchar", { length: 30 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "varchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("datetime", { precision: 6 }),
        tslib_1.__metadata("design:type", Date)
    ], PostWithOptions.prototype, "datetime", void 0);
    tslib_1.__decorate([
        Column_1.Column("timestamp", { precision: 6 }),
        tslib_1.__metadata("design:type", Date)
    ], PostWithOptions.prototype, "timestamp", void 0);
    tslib_1.__decorate([
        Column_1.Column("time", { precision: 3 }),
        tslib_1.__metadata("design:type", String)
    ], PostWithOptions.prototype, "time", void 0);
    PostWithOptions = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostWithOptions);
    return PostWithOptions;
}());
exports.PostWithOptions = PostWithOptions;
//# sourceMappingURL=PostWithOptions.js.map