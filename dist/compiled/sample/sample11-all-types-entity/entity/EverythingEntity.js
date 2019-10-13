"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var CreateDateColumn_1 = require("../../../src/decorator/columns/CreateDateColumn");
var UpdateDateColumn_1 = require("../../../src/decorator/columns/UpdateDateColumn");
var SampleEnum;
(function (SampleEnum) {
    SampleEnum["ONE"] = "one";
    SampleEnum["TWO"] = "two";
})(SampleEnum = exports.SampleEnum || (exports.SampleEnum = {}));
var EverythingEntity = /** @class */ (function () {
    function EverythingEntity() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], EverythingEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], EverythingEntity.prototype, "name", void 0);
    tslib_1.__decorate([
        index_1.Column("text"),
        tslib_1.__metadata("design:type", String)
    ], EverythingEntity.prototype, "text", void 0);
    tslib_1.__decorate([
        index_1.Column({ length: "32" }),
        tslib_1.__metadata("design:type", String)
    ], EverythingEntity.prototype, "shortTextColumn", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], EverythingEntity.prototype, "numberColumn", void 0);
    tslib_1.__decorate([
        index_1.Column("integer"),
        tslib_1.__metadata("design:type", Number)
    ], EverythingEntity.prototype, "integerColumn", void 0);
    tslib_1.__decorate([
        index_1.Column("int"),
        tslib_1.__metadata("design:type", Number)
    ], EverythingEntity.prototype, "intColumn", void 0);
    tslib_1.__decorate([
        index_1.Column("smallint"),
        tslib_1.__metadata("design:type", Number)
    ], EverythingEntity.prototype, "smallintColumn", void 0);
    tslib_1.__decorate([
        index_1.Column("bigint"),
        tslib_1.__metadata("design:type", Number)
    ], EverythingEntity.prototype, "bigintColumn", void 0);
    tslib_1.__decorate([
        index_1.Column("float"),
        tslib_1.__metadata("design:type", Number)
    ], EverythingEntity.prototype, "floatColumn", void 0);
    tslib_1.__decorate([
        index_1.Column("double"),
        tslib_1.__metadata("design:type", Number)
    ], EverythingEntity.prototype, "doubleColumn", void 0);
    tslib_1.__decorate([
        index_1.Column("decimal"),
        tslib_1.__metadata("design:type", Number)
    ], EverythingEntity.prototype, "decimalColumn", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", Date)
    ], EverythingEntity.prototype, "date", void 0);
    tslib_1.__decorate([
        index_1.Column("date"),
        tslib_1.__metadata("design:type", Date)
    ], EverythingEntity.prototype, "dateColumn", void 0);
    tslib_1.__decorate([
        index_1.Column("time"),
        tslib_1.__metadata("design:type", Date)
    ], EverythingEntity.prototype, "timeColumn", void 0);
    tslib_1.__decorate([
        index_1.Column("boolean"),
        tslib_1.__metadata("design:type", Boolean)
    ], EverythingEntity.prototype, "isBooleanColumn", void 0);
    tslib_1.__decorate([
        index_1.Column("boolean"),
        tslib_1.__metadata("design:type", Boolean)
    ], EverythingEntity.prototype, "isSecondBooleanColumn", void 0);
    tslib_1.__decorate([
        index_1.Column("json"),
        tslib_1.__metadata("design:type", Object)
    ], EverythingEntity.prototype, "jsonColumn", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", Object)
    ], EverythingEntity.prototype, "alsoJson", void 0);
    tslib_1.__decorate([
        index_1.Column("simple_array"),
        tslib_1.__metadata("design:type", Array)
    ], EverythingEntity.prototype, "simpleArrayColumn", void 0);
    tslib_1.__decorate([
        index_1.Column("enum", { enum: SampleEnum }),
        tslib_1.__metadata("design:type", String)
    ], EverythingEntity.prototype, "enum", void 0);
    tslib_1.__decorate([
        CreateDateColumn_1.CreateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], EverythingEntity.prototype, "createdDate", void 0);
    tslib_1.__decorate([
        UpdateDateColumn_1.UpdateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], EverythingEntity.prototype, "updatedDate", void 0);
    EverythingEntity = tslib_1.__decorate([
        index_1.Entity("sample11_everything_entity")
    ], EverythingEntity);
    return EverythingEntity;
}());
exports.EverythingEntity = EverythingEntity;
//# sourceMappingURL=EverythingEntity.js.map