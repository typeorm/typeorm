"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var Kollektion_1 = require("./Kollektion");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var Generated_1 = require("../../../../src/decorator/Generated");
var Artikel = /** @class */ (function () {
    function Artikel() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn("int", { name: "artikel_id" }),
        Generated_1.Generated(),
        tslib_1.__metadata("design:type", Number)
    ], Artikel.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({ name: "artikel_nummer" }),
        tslib_1.__metadata("design:type", String)
    ], Artikel.prototype, "nummer", void 0);
    tslib_1.__decorate([
        Column_1.Column({ name: "artikel_name" }),
        tslib_1.__metadata("design:type", String)
    ], Artikel.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column({ name: "artikel_extrabarcode" }),
        tslib_1.__metadata("design:type", String)
    ], Artikel.prototype, "extrabarcode", void 0);
    tslib_1.__decorate([
        Column_1.Column({ name: "artikel_saison" }),
        tslib_1.__metadata("design:type", String)
    ], Artikel.prototype, "saison", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Kollektion_1.Kollektion; }, { cascade: true }),
        JoinColumn_1.JoinColumn({ name: "id_kollektion" }),
        tslib_1.__metadata("design:type", Kollektion_1.Kollektion)
    ], Artikel.prototype, "kollektion", void 0);
    Artikel = tslib_1.__decorate([
        Entity_1.Entity("artikel")
    ], Artikel);
    return Artikel;
}());
exports.Artikel = Artikel;
//# sourceMappingURL=Artikel.js.map