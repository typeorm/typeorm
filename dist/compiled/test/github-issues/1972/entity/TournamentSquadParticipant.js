"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var TournamentParticipant_1 = require("./TournamentParticipant");
var User_1 = require("./User");
var TournamentSquadParticipant = /** @class */ (function (_super) {
    tslib_1.__extends(TournamentSquadParticipant, _super);
    function TournamentSquadParticipant(tournamentSquadParticipant) {
        var _this = _super.call(this) || this;
        if (tournamentSquadParticipant) {
            _this.users = tournamentSquadParticipant.users;
            _this.owner = tournamentSquadParticipant.owner;
        }
        return _this;
    }
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return User_1.User; }, {
            eager: true,
        }),
        index_1.JoinColumn(),
        tslib_1.__metadata("design:type", User_1.User)
    ], TournamentSquadParticipant.prototype, "owner", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return User_1.User; }, {
            eager: true,
        }),
        index_1.JoinTable({ name: "tournament_squad_participants" }),
        tslib_1.__metadata("design:type", Array)
    ], TournamentSquadParticipant.prototype, "users", void 0);
    TournamentSquadParticipant = tslib_1.__decorate([
        index_1.ChildEntity(),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], TournamentSquadParticipant);
    return TournamentSquadParticipant;
}(TournamentParticipant_1.TournamentParticipant));
exports.TournamentSquadParticipant = TournamentSquadParticipant;
//# sourceMappingURL=TournamentSquadParticipant.js.map