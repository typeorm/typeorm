"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var ManyToMany_1 = require("../../../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../../../src/decorator/relations/JoinTable");
var Subcounters_1 = require("./Subcounters");
var User_1 = require("./User");
var Counters = /** @class */ (function () {
    function Counters() {
    }
    tslib_1.__decorate([
        Column_1.Column(),
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
        ManyToMany_1.ManyToMany(function (type) { return User_1.User; }, function (user) { return user.likedPosts; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Counters.prototype, "likedUsers", void 0);
    return Counters;
}());
exports.Counters = Counters;
//# sourceMappingURL=Counters.js.map