"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var FruitEnum_1 = require("../enum/FruitEnum");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column("bit"),
        tslib_1.__metadata("design:type", Boolean)
    ], Post.prototype, "bit", void 0);
    tslib_1.__decorate([
        Column_1.Column("tinyint"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "tinyint", void 0);
    tslib_1.__decorate([
        Column_1.Column("smallint"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "smallint", void 0);
    tslib_1.__decorate([
        Column_1.Column("int"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "int", void 0);
    tslib_1.__decorate([
        Column_1.Column("bigint"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "bigint", void 0);
    tslib_1.__decorate([
        Column_1.Column("decimal"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "decimal", void 0);
    tslib_1.__decorate([
        Column_1.Column("dec"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "dec", void 0);
    tslib_1.__decorate([
        Column_1.Column("numeric"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "numeric", void 0);
    tslib_1.__decorate([
        Column_1.Column("float"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "float", void 0);
    tslib_1.__decorate([
        Column_1.Column("real"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "real", void 0);
    tslib_1.__decorate([
        Column_1.Column("smallmoney"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "smallmoney", void 0);
    tslib_1.__decorate([
        Column_1.Column("money"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "money", void 0);
    tslib_1.__decorate([
        Column_1.Column("uniqueidentifier"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "uniqueidentifier", void 0);
    tslib_1.__decorate([
        Column_1.Column("char"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "char", void 0);
    tslib_1.__decorate([
        Column_1.Column("varchar"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "varchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("text"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        Column_1.Column("nchar"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "nchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("nvarchar"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "nvarchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("ntext"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "ntext", void 0);
    tslib_1.__decorate([
        Column_1.Column("binary"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "binary", void 0);
    tslib_1.__decorate([
        Column_1.Column("varbinary"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "varbinary", void 0);
    tslib_1.__decorate([
        Column_1.Column("image"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "image", void 0);
    tslib_1.__decorate([
        Column_1.Column("rowversion"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "rowversion", void 0);
    tslib_1.__decorate([
        Column_1.Column("date"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "dateObj", void 0);
    tslib_1.__decorate([
        Column_1.Column("date"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "date", void 0);
    tslib_1.__decorate([
        Column_1.Column("datetime"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "datetime", void 0);
    tslib_1.__decorate([
        Column_1.Column("datetime2"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "datetime2", void 0);
    tslib_1.__decorate([
        Column_1.Column("smalldatetime"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "smalldatetime", void 0);
    tslib_1.__decorate([
        Column_1.Column("time"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "timeObj", void 0);
    tslib_1.__decorate([
        Column_1.Column("time"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "time", void 0);
    tslib_1.__decorate([
        Column_1.Column("datetimeoffset"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "datetimeoffset", void 0);
    tslib_1.__decorate([
        Column_1.Column("geometry"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "geometry1", void 0);
    tslib_1.__decorate([
        Column_1.Column("geometry"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "geometry2", void 0);
    tslib_1.__decorate([
        Column_1.Column("geometry"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "geometry3", void 0);
    tslib_1.__decorate([
        Column_1.Column("simple-array"),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "simpleArray", void 0);
    tslib_1.__decorate([
        Column_1.Column("simple-json"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "simpleJson", void 0);
    tslib_1.__decorate([
        Column_1.Column("simple-enum", { enum: ["A", "B", "C"] }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "simpleEnum", void 0);
    tslib_1.__decorate([
        Column_1.Column("simple-enum", { enum: FruitEnum_1.FruitEnum }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "simpleClassEnum1", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map