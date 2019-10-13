"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Counters_1 = require("./Counters");
var Question = /** @class */ (function () {
    function Question() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Question.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Question.prototype, "title", void 0);
    tslib_1.__decorate([
        index_1.Column(function (type) { return Counters_1.Counters; }),
        tslib_1.__metadata("design:type", Counters_1.Counters)
    ], Question.prototype, "counters", void 0);
    Question = tslib_1.__decorate([
        index_1.Entity("sample26_question")
    ], Question);
    return Question;
}());
exports.Question = Question;
//# sourceMappingURL=Question.js.map