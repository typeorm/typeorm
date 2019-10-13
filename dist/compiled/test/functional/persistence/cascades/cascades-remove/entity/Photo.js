"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var ManyToOne_1 = require("../../../../../../src/decorator/relations/ManyToOne");
var User_1 = require("./User");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var Photo = /** @class */ (function () {
    function Photo(name) {
        this.name = name;
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Photo.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return User_1.User; }, function (user) { return user.manyPhotos; }),
        tslib_1.__metadata("design:type", User_1.User)
    ], Photo.prototype, "user", void 0);
    Photo = tslib_1.__decorate([
        Entity_1.Entity(),
        tslib_1.__metadata("design:paramtypes", [String])
    ], Photo);
    return Photo;
}());
exports.Photo = Photo;
//# sourceMappingURL=Photo.js.map