"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var TestEntity2_1 = require("./TestEntity2");
var TestEntity4_1 = require("./TestEntity4");
var TestEntity3 = /** @class */ (function () {
    function TestEntity3() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], TestEntity3.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.OneToOne(function (t) { return TestEntity2_1.TestEntity2; }, function (a) { return a.Entity3; }),
        tslib_1.__metadata("design:type", TestEntity2_1.TestEntity2)
    ], TestEntity3.prototype, "Entity2", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], TestEntity3.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function (t) { return TestEntity4_1.TestEntity4; }, function (entity4) { return entity4.Entity3; }),
        tslib_1.__metadata("design:type", Array)
    ], TestEntity3.prototype, "Entity4", void 0);
    TestEntity3 = tslib_1.__decorate([
        src_1.Entity()
    ], TestEntity3);
    return TestEntity3;
}());
exports.TestEntity3 = TestEntity3;
//# sourceMappingURL=TestEntity3.js.map