"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var OneToOne_1 = require("../../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var Message_1 = require("./Message");
var Locale = /** @class */ (function () {
    function Locale() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn("varchar", { length: 5 }),
        tslib_1.__metadata("design:type", String)
    ], Locale.prototype, "code", void 0);
    tslib_1.__decorate([
        Column_1.Column("varchar", { length: 50 }),
        tslib_1.__metadata("design:type", String)
    ], Locale.prototype, "englishName", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function () { return Message_1.Message; }, { onDelete: "SET NULL" }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Message_1.Message)
    ], Locale.prototype, "name", void 0);
    Locale = tslib_1.__decorate([
        Entity_1.Entity()
    ], Locale);
    return Locale;
}());
exports.Locale = Locale;
//# sourceMappingURL=Locale.js.map