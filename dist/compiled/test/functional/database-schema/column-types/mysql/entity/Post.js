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
        Column_1.Column("bit"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "bit", void 0);
    tslib_1.__decorate([
        Column_1.Column("int"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "int", void 0);
    tslib_1.__decorate([
        Column_1.Column("integer"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "integer", void 0);
    tslib_1.__decorate([
        Column_1.Column("tinyint"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "tinyint", void 0);
    tslib_1.__decorate([
        Column_1.Column("smallint"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "smallint", void 0);
    tslib_1.__decorate([
        Column_1.Column("mediumint"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "mediumint", void 0);
    tslib_1.__decorate([
        Column_1.Column("bigint"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "bigint", void 0);
    tslib_1.__decorate([
        Column_1.Column("float"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "float", void 0);
    tslib_1.__decorate([
        Column_1.Column("double"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "double", void 0);
    tslib_1.__decorate([
        Column_1.Column("double precision"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "doublePrecision", void 0);
    tslib_1.__decorate([
        Column_1.Column("real"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "real", void 0);
    tslib_1.__decorate([
        Column_1.Column("dec"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "dec", void 0);
    tslib_1.__decorate([
        Column_1.Column("decimal"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "decimal", void 0);
    tslib_1.__decorate([
        Column_1.Column("numeric"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "numeric", void 0);
    tslib_1.__decorate([
        Column_1.Column("fixed"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "fixed", void 0);
    tslib_1.__decorate([
        Column_1.Column("boolean"),
        tslib_1.__metadata("design:type", Boolean)
    ], Post.prototype, "boolean", void 0);
    tslib_1.__decorate([
        Column_1.Column("bool"),
        tslib_1.__metadata("design:type", Boolean)
    ], Post.prototype, "bool", void 0);
    tslib_1.__decorate([
        Column_1.Column("char"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "char", void 0);
    tslib_1.__decorate([
        Column_1.Column("nchar"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "nChar", void 0);
    tslib_1.__decorate([
        Column_1.Column("national char"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "nationalChar", void 0);
    tslib_1.__decorate([
        Column_1.Column("varchar"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "varchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("nvarchar"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "nVarchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("national varchar"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "nationalVarchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("text"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        Column_1.Column("tinytext"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "tinytext", void 0);
    tslib_1.__decorate([
        Column_1.Column("mediumtext"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "mediumtext", void 0);
    tslib_1.__decorate([
        Column_1.Column("longtext"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "longtext", void 0);
    tslib_1.__decorate([
        Column_1.Column("binary"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "binary", void 0);
    tslib_1.__decorate([
        Column_1.Column("varbinary"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "varbinary", void 0);
    tslib_1.__decorate([
        Column_1.Column("blob"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "blob", void 0);
    tslib_1.__decorate([
        Column_1.Column("tinyblob"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "tinyblob", void 0);
    tslib_1.__decorate([
        Column_1.Column("mediumblob"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "mediumblob", void 0);
    tslib_1.__decorate([
        Column_1.Column("longblob"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "longblob", void 0);
    tslib_1.__decorate([
        Column_1.Column("date"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "date", void 0);
    tslib_1.__decorate([
        Column_1.Column("datetime"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "datetime", void 0);
    tslib_1.__decorate([
        Column_1.Column("timestamp"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "timestamp", void 0);
    tslib_1.__decorate([
        Column_1.Column("time"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "time", void 0);
    tslib_1.__decorate([
        Column_1.Column("year"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "year", void 0);
    tslib_1.__decorate([
        Column_1.Column("geometry"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "geometry", void 0);
    tslib_1.__decorate([
        Column_1.Column("point"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "point", void 0);
    tslib_1.__decorate([
        Column_1.Column("linestring"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "linestring", void 0);
    tslib_1.__decorate([
        Column_1.Column("polygon"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "polygon", void 0);
    tslib_1.__decorate([
        Column_1.Column("multipoint"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "multipoint", void 0);
    tslib_1.__decorate([
        Column_1.Column("multilinestring"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "multilinestring", void 0);
    tslib_1.__decorate([
        Column_1.Column("multipolygon"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "multipolygon", void 0);
    tslib_1.__decorate([
        Column_1.Column("geometrycollection"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "geometrycollection", void 0);
    tslib_1.__decorate([
        Column_1.Column("enum", { enum: ["A", "B", "C"] }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "enum", void 0);
    tslib_1.__decorate([
        Column_1.Column("enum", { enum: FruitEnum_1.FruitEnum }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "classEnum1", void 0);
    tslib_1.__decorate([
        Column_1.Column("json"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "json", void 0);
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