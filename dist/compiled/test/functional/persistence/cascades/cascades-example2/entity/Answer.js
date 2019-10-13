"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var ManyToOne_1 = require("../../../../../../src/decorator/relations/ManyToOne");
var Photo_1 = require("./Photo");
var User_1 = require("./User");
var Question_1 = require("./Question");
var Answer = /** @class */ (function () {
    function Answer() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Answer.prototype, "id", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Question_1.Question; }, function (question) { return question.answers; }, {
            cascade: ["insert"],
            nullable: false
        }),
        tslib_1.__metadata("design:type", Question_1.Question)
    ], Answer.prototype, "question", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Photo_1.Photo; }, {
            cascade: ["insert"],
            nullable: false
        }),
        tslib_1.__metadata("design:type", Photo_1.Photo)
    ], Answer.prototype, "photo", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return User_1.User; }, {
            cascade: ["insert"],
            nullable: false
        }),
        tslib_1.__metadata("design:type", User_1.User)
    ], Answer.prototype, "user", void 0);
    Answer = tslib_1.__decorate([
        Entity_1.Entity()
    ], Answer);
    return Answer;
}());
exports.Answer = Answer;
//# sourceMappingURL=Answer.js.map