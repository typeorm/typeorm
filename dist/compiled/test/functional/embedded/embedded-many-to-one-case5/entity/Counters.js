"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var JoinColumn_1 = require("../../../../../src/decorator/relations/JoinColumn");
var ManyToOne_1 = require("../../../../../src/decorator/relations/ManyToOne");
var PrimaryColumn_1 = require("../../../../../src/decorator/columns/PrimaryColumn");
var User_1 = require("./User");
var Subcounters_1 = require("./Subcounters");
var Counters = /** @class */ (function () {
    function Counters() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Counters.prototype, "code", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Counters.prototype, "likes", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Counters.prototype, "comments", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Counters.prototype, "favorites", void 0);
    tslib_1.__decorate([
        Column_1.Column(function () { return Subcounters_1.Subcounters; }, { prefix: "subcnt" }),
        tslib_1.__metadata("design:type", Subcounters_1.Subcounters)
    ], Counters.prototype, "subcounters", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return User_1.User; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", User_1.User)
    ], Counters.prototype, "likedUser", void 0);
    return Counters;
}());
exports.Counters = Counters;
//# sourceMappingURL=Counters.js.map