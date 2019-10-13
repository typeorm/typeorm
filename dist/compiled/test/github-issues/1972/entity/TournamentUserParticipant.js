"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var TournamentParticipant_1 = require("./TournamentParticipant");
var User_1 = require("./User");
var TournamentUserParticipant = /** @class */ (function (_super) {
    tslib_1.__extends(TournamentUserParticipant, _super);
    function TournamentUserParticipant(tournamentUserParticipant) {
        var _this = _super.call(this) || this;
        if (tournamentUserParticipant) {
            _this.user = tournamentUserParticipant.user;
        }
        return _this;
    }
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return User_1.User; }, {
            eager: true,
        }),
        index_1.JoinColumn(),
        tslib_1.__metadata("design:type", User_1.User)
    ], TournamentUserParticipant.prototype, "user", void 0);
    TournamentUserParticipant = tslib_1.__decorate([
        index_1.ChildEntity(),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], TournamentUserParticipant);
    return TournamentUserParticipant;
}(TournamentParticipant_1.TournamentParticipant));
exports.TournamentUserParticipant = TournamentUserParticipant;
//# sourceMappingURL=TournamentUserParticipant.js.map