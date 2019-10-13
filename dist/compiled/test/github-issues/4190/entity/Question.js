"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Question = /** @class */ (function () {
    function Question() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Question.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.ManyToMany("Category"),
        src_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Question.prototype, "categories", void 0);
    Question = tslib_1.__decorate([
        src_1.Entity()
    ], Question);
    return Question;
}());
exports.Question = Question;
//# sourceMappingURL=Question.js.map