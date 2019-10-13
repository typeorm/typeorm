"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Question = /** @class */ (function () {
    function Question() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn({ type: "smallint" }),
        tslib_1.__metadata("design:type", Number)
    ], Question.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Question.prototype, "name", void 0);
    Question = tslib_1.__decorate([
        Entity_1.Entity()
    ], Question);
    return Question;
}());
exports.Question = Question;
//# sourceMappingURL=Question.js.map