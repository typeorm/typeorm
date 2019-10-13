"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var Tournament_1 = require("./Tournament");
var BilliardsTournament = /** @class */ (function (_super) {
    tslib_1.__extends(BilliardsTournament, _super);
    function BilliardsTournament(billiardsTournament) {
        return _super.call(this, billiardsTournament) || this;
    }
    BilliardsTournament = tslib_1.__decorate([
        index_1.ChildEntity() // Causes Error of duplicated column in generated sql
        ,
        tslib_1.__metadata("design:paramtypes", [Object])
    ], BilliardsTournament);
    return BilliardsTournament;
}(Tournament_1.Tournament));
exports.BilliardsTournament = BilliardsTournament;
//# sourceMappingURL=BilliardsTournament.js.map