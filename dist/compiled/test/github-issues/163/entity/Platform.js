"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Index_1 = require("../../../../src/decorator/Index");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var ManyToMany_1 = require("../../../../src/decorator/relations/ManyToMany");
var Game_1 = require("./Game");
var Platform = /** @class */ (function () {
    function Platform() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Platform.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({
            length: 100
        }),
        tslib_1.__metadata("design:type", String)
    ], Platform.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column({
            length: 100
        }),
        tslib_1.__metadata("design:type", String)
    ], Platform.prototype, "slug", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Game_1.Game; }, function (game) { return game.platforms; }),
        tslib_1.__metadata("design:type", Array)
    ], Platform.prototype, "games", void 0);
    Platform = tslib_1.__decorate([
        Entity_1.Entity("platforms"),
        Index_1.Index("platform_name_idx", ["name"], { unique: true })
    ], Platform);
    return Platform;
}());
exports.Platform = Platform;
//# sourceMappingURL=Platform.js.map