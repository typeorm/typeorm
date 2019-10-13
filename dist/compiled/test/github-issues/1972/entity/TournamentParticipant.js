"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var TournamentParticipant = /** @class */ (function () {
    function TournamentParticipant() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], TournamentParticipant.prototype, "id", void 0);
    TournamentParticipant = tslib_1.__decorate([
        index_1.Entity(),
        index_1.TableInheritance({
            pattern: "STI",
            column: {
                name: "type",
                type: "varchar",
            },
        })
    ], TournamentParticipant);
    return TournamentParticipant;
}());
exports.TournamentParticipant = TournamentParticipant;
//# sourceMappingURL=TournamentParticipant.js.map