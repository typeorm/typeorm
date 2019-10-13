"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var Group_1 = require("./Group");
var Player = /** @class */ (function () {
    function Player() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], Player.prototype, "email", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Group_1.Group; }),
        tslib_1.__metadata("design:type", Group_1.Group)
    ], Player.prototype, "group", void 0);
    Player = tslib_1.__decorate([
        Entity_1.Entity()
    ], Player);
    return Player;
}());
exports.Player = Player;
//# sourceMappingURL=Player.js.map