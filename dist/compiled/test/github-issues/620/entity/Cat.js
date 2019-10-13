"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var Dog_1 = require("./Dog");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Cat = /** @class */ (function () {
    function Cat() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Cat.prototype, "id", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Dog_1.Dog; }, function (dog) { return dog.cats; }),
        tslib_1.__metadata("design:type", Dog_1.Dog)
    ], Cat.prototype, "dog", void 0);
    Cat = tslib_1.__decorate([
        index_1.Entity()
    ], Cat);
    return Cat;
}());
exports.Cat = Cat;
//# sourceMappingURL=Cat.js.map