"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../src");
var NumericEnum;
(function (NumericEnum) {
    NumericEnum[NumericEnum["ADMIN"] = 0] = "ADMIN";
    NumericEnum[NumericEnum["EDITOR"] = 1] = "EDITOR";
    NumericEnum[NumericEnum["MODERATOR"] = 2] = "MODERATOR";
    NumericEnum[NumericEnum["GHOST"] = 3] = "GHOST";
})(NumericEnum = exports.NumericEnum || (exports.NumericEnum = {}));
var StringEnum;
(function (StringEnum) {
    StringEnum["ADMIN"] = "a";
    StringEnum["EDITOR"] = "e";
    StringEnum["MODERATOR"] = "m";
    StringEnum["GHOST"] = "g";
})(StringEnum = exports.StringEnum || (exports.StringEnum = {}));
var StringNumericEnum;
(function (StringNumericEnum) {
    StringNumericEnum["ONE"] = "1";
    StringNumericEnum["TWO"] = "2";
    StringNumericEnum["THREE"] = "3";
    StringNumericEnum["FOUR"] = "4";
})(StringNumericEnum = exports.StringNumericEnum || (exports.StringNumericEnum = {}));
var HeterogeneousEnum;
(function (HeterogeneousEnum) {
    HeterogeneousEnum[HeterogeneousEnum["NO"] = 0] = "NO";
    HeterogeneousEnum["YES"] = "YES";
})(HeterogeneousEnum = exports.HeterogeneousEnum || (exports.HeterogeneousEnum = {}));
var EnumArrayEntity = /** @class */ (function () {
    function EnumArrayEntity() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], EnumArrayEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "simple-enum",
            enum: NumericEnum,
            array: true,
            default: [NumericEnum.GHOST, NumericEnum.ADMIN]
        }),
        tslib_1.__metadata("design:type", Array)
    ], EnumArrayEntity.prototype, "numericEnums", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "simple-enum",
            enum: StringEnum,
            array: true,
            default: []
        }),
        tslib_1.__metadata("design:type", Array)
    ], EnumArrayEntity.prototype, "stringEnums", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "simple-enum",
            enum: StringNumericEnum,
            array: true,
            default: [StringNumericEnum.THREE, StringNumericEnum.ONE]
        }),
        tslib_1.__metadata("design:type", Array)
    ], EnumArrayEntity.prototype, "stringNumericEnums", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "simple-enum",
            enum: HeterogeneousEnum,
            array: true,
            default: [HeterogeneousEnum.YES]
        }),
        tslib_1.__metadata("design:type", Array)
    ], EnumArrayEntity.prototype, "heterogeneousEnums", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "simple-enum",
            enum: ["admin", "editor", "ghost"],
            array: true,
            default: ["admin"]
        }),
        tslib_1.__metadata("design:type", Array)
    ], EnumArrayEntity.prototype, "arrayDefinedStringEnums", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "simple-enum",
            enum: [11, 12, 13],
            array: true,
            default: [11, 13]
        }),
        tslib_1.__metadata("design:type", Array)
    ], EnumArrayEntity.prototype, "arrayDefinedNumericEnums", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "simple-enum",
            enum: StringEnum,
            array: true,
            nullable: true
        }),
        tslib_1.__metadata("design:type", Array)
    ], EnumArrayEntity.prototype, "enumWithoutDefault", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "simple-enum",
            enum: StringEnum,
            array: true,
            default: "{}"
        }),
        tslib_1.__metadata("design:type", Array)
    ], EnumArrayEntity.prototype, "legacyDefaultAsString", void 0);
    EnumArrayEntity = tslib_1.__decorate([
        src_1.Entity()
    ], EnumArrayEntity);
    return EnumArrayEntity;
}());
exports.EnumArrayEntity = EnumArrayEntity;
//# sourceMappingURL=EnumArrayEntity.js.map