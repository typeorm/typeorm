"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Answer_1 = require("./Answer");
var OneToMany_1 = require("../../../../../../src/decorator/relations/OneToMany");
var Question = /** @class */ (function () {
    function Question() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Question.prototype, "id", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Answer_1.Answer; }, function (answer) { return answer.question; }, { cascade: ["insert"] }),
        tslib_1.__metadata("design:type", Array)
    ], Question.prototype, "answers", void 0);
    Question = tslib_1.__decorate([
        Entity_1.Entity()
    ], Question);
    return Question;
}());
exports.Question = Question;
//# sourceMappingURL=Question.js.map