"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Index_1 = require("../../../../src/decorator/Index");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Message_1 = require("./Message");
var Locale_1 = require("./Locale");
var Translation = /** @class */ (function () {
    function Translation() {
    }
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function () { return Locale_1.Locale; }, { primary: true, nullable: false }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Locale_1.Locale)
    ], Translation.prototype, "locale", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function () { return Message_1.Message; }, { primary: true, nullable: false }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Message_1.Message)
    ], Translation.prototype, "message", void 0);
    tslib_1.__decorate([
        Column_1.Column("text"),
        tslib_1.__metadata("design:type", String)
    ], Translation.prototype, "text", void 0);
    Translation = tslib_1.__decorate([
        Entity_1.Entity(),
        Index_1.Index(["locale", "message"], { unique: true })
    ], Translation);
    return Translation;
}());
exports.Translation = Translation;
//# sourceMappingURL=Translation.js.map