"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Question_1 = require("./Question");
var ManyToOne_1 = require("../../../../../../src/decorator/relations/ManyToOne");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Question_1.Question; }, {
            cascade: ["insert"],
            nullable: true
        }),
        tslib_1.__metadata("design:type", Question_1.Question)
    ], User.prototype, "question", void 0);
    User = tslib_1.__decorate([
        Entity_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map