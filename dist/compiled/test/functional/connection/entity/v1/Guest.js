"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var OneToMany_1 = require("../../../../../src/decorator/relations/OneToMany");
var Comment_1 = require("./Comment");
var Guest = /** @class */ (function () {
    function Guest() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Guest.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Guest.prototype, "username", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Comment_1.Comment; }, function (comment) { return comment.author; }),
        tslib_1.__metadata("design:type", Array)
    ], Guest.prototype, "comments", void 0);
    Guest = tslib_1.__decorate([
        Entity_1.Entity()
    ], Guest);
    return Guest;
}());
exports.Guest = Guest;
//# sourceMappingURL=Guest.js.map