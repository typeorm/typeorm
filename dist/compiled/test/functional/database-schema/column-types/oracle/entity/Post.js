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
        Column_1.Column("number"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "number", void 0);
    tslib_1.__decorate([
        Column_1.Column("numeric"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "numeric", void 0);
    tslib_1.__decorate([
        Column_1.Column("float"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "float", void 0);
    tslib_1.__decorate([
        Column_1.Column("dec"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "dec", void 0);
    tslib_1.__decorate([
        Column_1.Column("decimal"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "decimal", void 0);
    tslib_1.__decorate([
        Column_1.Column("int"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "int", void 0);
    tslib_1.__decorate([
        Column_1.Column("integer"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "integer", void 0);
    tslib_1.__decorate([
        Column_1.Column("smallint"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "smallint", void 0);
    tslib_1.__decorate([
        Column_1.Column("real"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "real", void 0);
    tslib_1.__decorate([
        Column_1.Column("double precision"),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "doublePrecision", void 0);
    tslib_1.__decorate([
        Column_1.Column("char"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "char", void 0);
    tslib_1.__decorate([
        Column_1.Column("nchar"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "nchar", void 0);
    tslib_1.__decorate([
        Column_1.Column("nvarchar2"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "nvarchar2", void 0);
    tslib_1.__decorate([
        Column_1.Column("varchar2"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "varchar2", void 0);
    tslib_1.__decorate([
        Column_1.Column("long"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "long", void 0);
    tslib_1.__decorate([
        Column_1.Column("raw"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "raw", void 0);
    tslib_1.__decorate([
        Column_1.Column("date"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "dateObj", void 0);
    tslib_1.__decorate([
        Column_1.Column("date"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "date", void 0);
    tslib_1.__decorate([
        Column_1.Column("timestamp"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "timestamp", void 0);
    tslib_1.__decorate([
        Column_1.Column("timestamp with time zone"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "timestampWithTimeZone", void 0);
    tslib_1.__decorate([
        Column_1.Column("timestamp with local time zone"),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "timestampWithLocalTimeZone", void 0);
    tslib_1.__decorate([
        Column_1.Column("blob"),
        tslib_1.__metadata("design:type", Buffer)
    ], Post.prototype, "blob", void 0);
    tslib_1.__decorate([
        Column_1.Column("clob"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "clob", void 0);
    tslib_1.__decorate([
        Column_1.Column("nclob"),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "nclob", void 0);
    tslib_1.__decorate([
        Column_1.Column("simple-array"),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "simpleArray", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map