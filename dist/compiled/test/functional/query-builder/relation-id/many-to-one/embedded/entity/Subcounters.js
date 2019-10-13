"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../../../../src/decorator/relations/ManyToOne");
var PrimaryGeneratedColumn_1 = require("../../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var User_1 = require("./User");
var Subcounters = /** @class */ (function () {
    function Subcounters() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Subcounters.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Subcounters.prototype, "version", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Subcounters.prototype, "watches", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return User_1.User; }),
        tslib_1.__metadata("design:type", User_1.User)
    ], Subcounters.prototype, "watchedUser", void 0);
    return Subcounters;
}());
exports.Subcounters = Subcounters;
//# sourceMappingURL=Subcounters.js.map