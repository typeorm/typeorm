"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var TournamentGraph_1 = require("./TournamentGraph");
var Tournament = /** @class */ (function () {
    function Tournament(tournament) {
        if (tournament) {
            this.name = tournament.name;
        }
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Tournament.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Tournament.prototype, "name", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return TournamentGraph_1.TournamentGraph; }, function (graph) { return graph.tournament; }),
        index_1.JoinColumn(),
        tslib_1.__metadata("design:type", TournamentGraph_1.TournamentGraph)
    ], Tournament.prototype, "graph", void 0);
    Tournament = tslib_1.__decorate([
        index_1.Entity(),
        index_1.TableInheritance({
            pattern: "STI",
            column: {
                name: "type",
                type: "varchar",
            },
        }),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], Tournament);
    return Tournament;
}());
exports.Tournament = Tournament;
//# sourceMappingURL=Tournament.js.map