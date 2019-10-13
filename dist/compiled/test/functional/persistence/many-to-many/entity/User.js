"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../../src/decorator/relations/ManyToOne");
var Post_1 = require("./Post");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Post_1.Post; }, { cascade: ["update"] }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], User.prototype, "post", void 0);
    User = tslib_1.__decorate([
        Entity_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map