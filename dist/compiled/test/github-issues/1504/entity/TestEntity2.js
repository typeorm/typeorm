"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var TestEntity1_1 = require("./TestEntity1");
var TestEntity3_1 = require("./TestEntity3");
var TestEntity2 = /** @class */ (function () {
    function TestEntity2() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], TestEntity2.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], TestEntity2.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.OneToOne(function (t) { return TestEntity1_1.TestEntity1; }, function (a) { return a.Entity2; }),
        tslib_1.__metadata("design:type", TestEntity1_1.TestEntity1)
    ], TestEntity2.prototype, "Entity1", void 0);
    tslib_1.__decorate([
        src_1.OneToOne(function (t) { return TestEntity3_1.TestEntity3; }, function (a) { return a.Entity2; }),
        src_1.JoinColumn(),
        tslib_1.__metadata("design:type", TestEntity3_1.TestEntity3)
    ], TestEntity2.prototype, "Entity3", void 0);
    TestEntity2 = tslib_1.__decorate([
        src_1.Entity()
    ], TestEntity2);
    return TestEntity2;
}());
exports.TestEntity2 = TestEntity2;
//# sourceMappingURL=TestEntity2.js.map