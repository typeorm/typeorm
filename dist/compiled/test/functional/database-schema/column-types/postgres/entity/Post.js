"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
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
        Column_1.Column("integer"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "integer", void 0);
    tslib_1.__decorate([
        Column_1.Column("int4"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "int4", void 0);
    tslib_1.__decorate([
        Column_1.Column("int"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "int", void 0);
    tslib_1.__decorate([
        Column_1.Column("smallint"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "smallint", void 0);
    tslib_1.__decorate([
        Column_1.Column("int2"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "int2", void 0);
    tslib_1.__decorate([
        Column_1.Column("bigint"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "bigint", void 0);
    tslib_1.__decorate([
        Column_1.Column("int8"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "int8", void 0);
    tslib_1.__decorate([
        Column_1.Column("numeric"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "numeric", void 0);
    tslib_1.__decorate([
        Column_1.Column("decimal"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "decimal", void 0);
    tslib_1.__decorate([
        Column_1.Column("double precision"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "doublePrecision", void 0);
    tslib_1.__decorate([
        Column_1.Column("float8"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "float8", void 0);
    tslib_1.__decorate([
        Column_1.Column("real"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "real", void 0);
    tslib_1.__decorate([
        Column_1.Column("float4"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "float4", void 0);
    tslib_1.__decorate([
        Column_1.Column("money"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "money", void 0);
    tslib_1.__decorate([
        Column_1.Column("char"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "char", void 0);
    tslib_1.__decorate([
        Column_1.Column("character"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "character", void 0);
    tslib_1.__decorate([
        Column_1.Column("varchar"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "varchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("character varying"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "characterVarying", void 0);
    tslib_1.__decorate([
        Column_1.Column("text"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        Column_1.Column("citext"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "citext", void 0);
    tslib_1.__decorate([
        Column_1.Column("hstore"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "hstore", void 0);
    tslib_1.__decorate([
        Column_1.Column("bytea"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "bytea", void 0);
    tslib_1.__decorate([
        Column_1.Column("date"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "date", void 0);
    tslib_1.__decorate([
        Column_1.Column("interval"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "interval", void 0);
    tslib_1.__decorate([
        Column_1.Column("time"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "time", void 0);
    tslib_1.__decorate([
        Column_1.Column("time with time zone"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "timeWithTimeZone", void 0);
    tslib_1.__decorate([
        Column_1.Column("timetz"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "timetz", void 0);
    tslib_1.__decorate([
        Column_1.Column("timestamp"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "timestamp", void 0);
    tslib_1.__decorate([
        Column_1.Column("timestamp with time zone"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "timestampWithTimeZone", void 0);
    tslib_1.__decorate([
        Column_1.Column("timestamptz"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "timestamptz", void 0);
    tslib_1.__decorate([
        Column_1.Column("boolean"),
        tslib_1.__metadata("design:type", Boolean)
    ], Post.prototype, "boolean", void 0);
    tslib_1.__decorate([
        Column_1.Column("bool"),
        tslib_1.__metadata("design:type", Boolean)
    ], Post.prototype, "bool", void 0);
    tslib_1.__decorate([
        Column_1.Column("enum", { enum: ["A", "B", "C"] }),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "enum", void 0);
    tslib_1.__decorate([
        Column_1.Column("point"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "point", void 0);
    tslib_1.__decorate([
        Column_1.Column("line"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "line", void 0);
    tslib_1.__decorate([
        Column_1.Column("lseg"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "lseg", void 0);
    tslib_1.__decorate([
        Column_1.Column("box"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "box", void 0);
    tslib_1.__decorate([
        Column_1.Column("path"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "path", void 0);
    tslib_1.__decorate([
        Column_1.Column("polygon"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "polygon", void 0);
    tslib_1.__decorate([
        Column_1.Column("circle"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "circle", void 0);
    tslib_1.__decorate([
        Column_1.Column("cidr"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "cidr", void 0);
    tslib_1.__decorate([
        Column_1.Column("inet"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "inet", void 0);
    tslib_1.__decorate([
        Column_1.Column("macaddr"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "macaddr", void 0);
    tslib_1.__decorate([
        Column_1.Column("bit"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "bit", void 0);
    tslib_1.__decorate([
        Column_1.Column("varbit"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "varbit", void 0);
    tslib_1.__decorate([
        Column_1.Column("bit varying"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "bitVarying", void 0);
    tslib_1.__decorate([
        Column_1.Column("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "uuid", void 0);
    tslib_1.__decorate([
        Column_1.Column("xml"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "xml", void 0);
    tslib_1.__decorate([
        Column_1.Column("json"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "json", void 0);
    tslib_1.__decorate([
        Column_1.Column("jsonb"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "jsonb", void 0);
    tslib_1.__decorate([
        Column_1.Column("int4range"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "int4range", void 0);
    tslib_1.__decorate([
        Column_1.Column("int8range"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "int8range", void 0);
    tslib_1.__decorate([
        Column_1.Column("numrange"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "numrange", void 0);
    tslib_1.__decorate([
        Column_1.Column("tsrange"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "tsrange", void 0);
    tslib_1.__decorate([
        Column_1.Column("tstzrange"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "tstzrange", void 0);
    tslib_1.__decorate([
        Column_1.Column("daterange"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "daterange", void 0);
    tslib_1.__decorate([
        Column_1.Column("int", { array: true }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "array", void 0);
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
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map