"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var OneToMany_1 = require("../../../../src/decorator/relations/OneToMany");
var Cat_1 = require("./Cat");
var Dog = /** @class */ (function () {
    function Dog() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], Dog.prototype, "DogID", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Cat_1.Cat; }, function (cat) { return cat.dog; }),
        tslib_1.__metadata("design:type", Array)
    ], Dog.prototype, "cats", void 0);
    Dog = tslib_1.__decorate([
        index_1.Entity()
    ], Dog);
    return Dog;
}());
exports.Dog = Dog;
//# sourceMappingURL=Dog.js.map