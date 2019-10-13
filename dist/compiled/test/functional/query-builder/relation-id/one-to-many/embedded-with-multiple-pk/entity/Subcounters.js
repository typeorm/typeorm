"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../../src/decorator/columns/Column");
var PrimaryColumn_1 = require("../../../../../../../src/decorator/columns/PrimaryColumn");
var OneToMany_1 = require("../../../../../../../src/decorator/relations/OneToMany");
var User_1 = require("./User");
var Subcounters = /** @class */ (function () {
    function Subcounters() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Subcounters.prototype, "version", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Subcounters.prototype, "watches", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return User_1.User; }, function (user) { return user.post; }),
        tslib_1.__metadata("design:type", Array)
    ], Subcounters.prototype, "watchedUsers", void 0);
    return Subcounters;
}());
exports.Subcounters = Subcounters;
//# sourceMappingURL=Subcounters.js.map