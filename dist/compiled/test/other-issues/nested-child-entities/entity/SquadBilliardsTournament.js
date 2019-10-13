"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var BilliardsTournament_1 = require("./BilliardsTournament");
var SquadBilliardsTournament = /** @class */ (function (_super) {
    tslib_1.__extends(SquadBilliardsTournament, _super);
    function SquadBilliardsTournament(squadBilliardsTournament) {
        return _super.call(this, squadBilliardsTournament) || this;
    }
    SquadBilliardsTournament = tslib_1.__decorate([
        index_1.ChildEntity(),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], SquadBilliardsTournament);
    return SquadBilliardsTournament;
}(BilliardsTournament_1.BilliardsTournament));
exports.SquadBilliardsTournament = SquadBilliardsTournament;
//# sourceMappingURL=SquadBilliardsTournament.js.map