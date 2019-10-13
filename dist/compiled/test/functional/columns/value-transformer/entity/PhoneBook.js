"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var PhonesTransformer = /** @class */ (function () {
    function PhonesTransformer() {
    }
    PhonesTransformer.prototype.to = function (value) {
        return JSON.stringify(tslib_1.__spread(value));
    };
    PhonesTransformer.prototype.from = function (value) {
        return new Map(JSON.parse(value));
    };
    return PhonesTransformer;
}());
var PhoneBook = /** @class */ (function () {
    function PhoneBook() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PhoneBook.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PhoneBook.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: String, transformer: new PhonesTransformer() }),
        tslib_1.__metadata("design:type", Map)
    ], PhoneBook.prototype, "phones", void 0);
    PhoneBook = tslib_1.__decorate([
        Entity_1.Entity()
    ], PhoneBook);
    return PhoneBook;
}());
exports.PhoneBook = PhoneBook;
//# sourceMappingURL=PhoneBook.js.map