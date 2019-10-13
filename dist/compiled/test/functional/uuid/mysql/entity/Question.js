"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Generated_1 = require("../../../../../src/decorator/Generated");
var Question = /** @class */ (function () {
    function Question() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Question.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        Generated_1.Generated("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Question.prototype, "uuid", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Question.prototype, "uuid2", void 0);
    tslib_1.__decorate([
        Column_1.Column("varchar", { nullable: true }),
        tslib_1.__metadata("design:type", Object)
    ], Question.prototype, "uuid3", void 0);
    tslib_1.__decorate([
        Column_1.Column("varchar", { nullable: true }),
        Generated_1.Generated("uuid"),
        tslib_1.__metadata("design:type", Object)
    ], Question.prototype, "uuid4", void 0);
    Question = tslib_1.__decorate([
        Entity_1.Entity()
    ], Question);
    return Question;
}());
exports.Question = Question;
//# sourceMappingURL=Question.js.map