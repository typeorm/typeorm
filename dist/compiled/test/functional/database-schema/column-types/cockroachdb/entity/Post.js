"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../../src");
var src_2 = require("../../../../../../src");
var src_3 = require("../../../../../../src");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        src_2.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        src_3.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "name", void 0);
    tslib_1.__decorate([
        src_3.Column("integer"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "integer", void 0);
    tslib_1.__decorate([
        src_3.Column("int4"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "int4", void 0);
    tslib_1.__decorate([
        src_3.Column("int"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "int", void 0);
    tslib_1.__decorate([
        src_3.Column("smallint"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "smallint", void 0);
    tslib_1.__decorate([
        src_3.Column("int2"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "int2", void 0);
    tslib_1.__decorate([
        src_3.Column("bigint"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "bigint", void 0);
    tslib_1.__decorate([
        src_3.Column("int8"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "int8", void 0);
    tslib_1.__decorate([
        src_3.Column("int64"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "int64", void 0);
    tslib_1.__decorate([
        src_3.Column("double precision"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "doublePrecision", void 0);
    tslib_1.__decorate([
        src_3.Column("float4"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "float4", void 0);
    tslib_1.__decorate([
        src_3.Column("float8"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "float8", void 0);
    tslib_1.__decorate([
        src_3.Column("real"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "real", void 0);
    tslib_1.__decorate([
        src_3.Column("numeric"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "numeric", void 0);
    tslib_1.__decorate([
        src_3.Column("decimal"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "decimal", void 0);
    tslib_1.__decorate([
        src_3.Column("dec"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "dec", void 0);
    tslib_1.__decorate([
        src_3.Column("char"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "char", void 0);
    tslib_1.__decorate([
        src_3.Column("character"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "character", void 0);
    tslib_1.__decorate([
        src_3.Column("varchar"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "varchar", void 0);
    tslib_1.__decorate([
        src_3.Column("character varying"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "characterVarying", void 0);
    tslib_1.__decorate([
        src_3.Column("char varying"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "charVarying", void 0);
    tslib_1.__decorate([
        src_3.Column("string"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "string", void 0);
    tslib_1.__decorate([
        src_3.Column("text"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        src_3.Column("bytes"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "bytes", void 0);
    tslib_1.__decorate([
        src_3.Column("bytea"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "bytea", void 0);
    tslib_1.__decorate([
        src_3.Column("blob"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "blob", void 0);
    tslib_1.__decorate([
        src_3.Column("date"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "date", void 0);
    tslib_1.__decorate([
        src_3.Column("interval"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "interval", void 0);
    tslib_1.__decorate([
        src_3.Column("time"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "time", void 0);
    tslib_1.__decorate([
        src_3.Column("time without time zone"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "timeWithoutTimeZone", void 0);
    tslib_1.__decorate([
        src_3.Column("timestamp"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "timestamp", void 0);
    tslib_1.__decorate([
        src_3.Column("timestamp with time zone"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "timestampWithTimeZone", void 0);
    tslib_1.__decorate([
        src_3.Column("timestamp without time zone"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "timestampWithoutTimeZone", void 0);
    tslib_1.__decorate([
        src_3.Column("timestamptz"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "timestamptz", void 0);
    tslib_1.__decorate([
        src_3.Column("boolean"),
        tslib_1.__metadata("design:type", Boolean)
    ], Post.prototype, "boolean", void 0);
    tslib_1.__decorate([
        src_3.Column("bool"),
        tslib_1.__metadata("design:type", Boolean)
    ], Post.prototype, "bool", void 0);
    tslib_1.__decorate([
        src_3.Column("inet"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "inet", void 0);
    tslib_1.__decorate([
        src_3.Column("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "uuid", void 0);
    tslib_1.__decorate([
        src_3.Column("jsonb"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "jsonb", void 0);
    tslib_1.__decorate([
        src_3.Column("json"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "json", void 0);
    tslib_1.__decorate([
        src_3.Column("int", { array: true }),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "array", void 0);
    tslib_1.__decorate([
        src_3.Column("simple-array"),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "simpleArray", void 0);
    tslib_1.__decorate([
        src_3.Column("simple-json"),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "simpleJson", void 0);
    Post = tslib_1.__decorate([
        src_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map