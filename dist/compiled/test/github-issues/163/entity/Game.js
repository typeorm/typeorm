"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Index_1 = require("../../../../src/decorator/Index");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var ManyToMany_1 = require("../../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../../src/decorator/relations/JoinTable");
var Platform_1 = require("./Platform");
var Game = /** @class */ (function () {
    function Game() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Game.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({
            length: 80
        }),
        tslib_1.__metadata("design:type", String)
    ], Game.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column({
            name: "search_terms",
            length: 80
        }),
        tslib_1.__metadata("design:type", String)
    ], Game.prototype, "searchTerms", void 0);
    tslib_1.__decorate([
        Column_1.Column({
            name: "reviewed"
        }),
        tslib_1.__metadata("design:type", Boolean)
    ], Game.prototype, "isReviewed", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Platform_1.Platform; }, function (platform) { return platform.games; }, {
            cascade: true
        }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Game.prototype, "platforms", void 0);
    Game = tslib_1.__decorate([
        Entity_1.Entity("games"),
        Index_1.Index("game_name_idx", ["name"], { unique: true })
    ], Game);
    return Game;
}());
exports.Game = Game;
//# sourceMappingURL=Game.js.map