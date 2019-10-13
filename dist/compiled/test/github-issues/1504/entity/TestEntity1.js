"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var TestEntity2_1 = require("./TestEntity2");
var TestEntity1 = /** @class */ (function () {
    function TestEntity1() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], TestEntity1.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], TestEntity1.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.OneToOne(function (t) { return TestEntity2_1.TestEntity2; }, function (a) { return a.Entity1; }),
        src_1.JoinColumn(),
        tslib_1.__metadata("design:type", TestEntity2_1.TestEntity2)
    ], TestEntity1.prototype, "Entity2", void 0);
    TestEntity1 = tslib_1.__decorate([
        src_1.Entity()
    ], TestEntity1);
    return TestEntity1;
}());
exports.TestEntity1 = TestEntity1;
//# sourceMappingURL=TestEntity1.js.map