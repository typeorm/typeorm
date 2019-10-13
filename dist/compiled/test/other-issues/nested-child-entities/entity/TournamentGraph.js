"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var Tournament_1 = require("./Tournament");
var TournamentGraph = /** @class */ (function () {
    function TournamentGraph() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], TournamentGraph.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return Tournament_1.Tournament; }, function (tournament) { return tournament.graph; }),
        tslib_1.__metadata("design:type", Tournament_1.Tournament)
    ], TournamentGraph.prototype, "tournament", void 0);
    TournamentGraph = tslib_1.__decorate([
        index_1.Entity()
    ], TournamentGraph);
    return TournamentGraph;
}());
exports.TournamentGraph = TournamentGraph;
//# sourceMappingURL=TournamentGraph.js.map