"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var ManyToMany_1 = require("../../../../../../src/decorator/relations/ManyToMany");
var Photo_1 = require("./Photo");
var OneToMany_1 = require("../../../../../../src/decorator/relations/OneToMany");
var JoinTable_1 = require("../../../../../../src/decorator/relations/JoinTable");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "name", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Photo_1.Photo; }, function (photo) { return photo.user; }, { cascade: true }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "manyPhotos", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Photo_1.Photo; }, { cascade: true }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "manyToManyPhotos", void 0);
    User = tslib_1.__decorate([
        Entity_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map