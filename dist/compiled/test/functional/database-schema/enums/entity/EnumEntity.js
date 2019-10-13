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
var EnumEntity = /** @class */ (function () {
    function EnumEntity() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], EnumEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "enum",
            enum: NumericEnum,
            default: NumericEnum.MODERATOR
        }),
        tslib_1.__metadata("design:type", Number)
    ], EnumEntity.prototype, "numericEnum", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "enum",
            enum: StringEnum,
            default: StringEnum.GHOST
        }),
        tslib_1.__metadata("design:type", String)
    ], EnumEntity.prototype, "stringEnum", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "enum",
            enum: StringNumericEnum,
            default: StringNumericEnum.FOUR
        }),
        tslib_1.__metadata("design:type", String)
    ], EnumEntity.prototype, "stringNumericEnum", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "enum",
            enum: HeterogeneousEnum,
            default: HeterogeneousEnum.NO
        }),
        tslib_1.__metadata("design:type", Object)
    ], EnumEntity.prototype, "heterogeneousEnum", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "enum",
            enum: ["admin", "editor", "ghost"],
            default: "ghost"
        }),
        tslib_1.__metadata("design:type", String)
    ], EnumEntity.prototype, "arrayDefinedStringEnum", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "enum",
            enum: [11, 12, 13],
            default: 12
        }),
        tslib_1.__metadata("design:type", Number)
    ], EnumEntity.prototype, "arrayDefinedNumericEnum", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "enum",
            enum: StringEnum,
        }),
        tslib_1.__metadata("design:type", String)
    ], EnumEntity.prototype, "enumWithoutdefault", void 0);
    EnumEntity = tslib_1.__decorate([
        src_1.Entity()
    ], EnumEntity);
    return EnumEntity;
}());
exports.EnumEntity = EnumEntity;
//# sourceMappingURL=EnumEntity.js.map