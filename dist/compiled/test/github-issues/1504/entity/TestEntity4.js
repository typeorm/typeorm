"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var TestEntity3_1 = require("./TestEntity3");
var TestEntity4 = /** @class */ (function () {
    function TestEntity4() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], TestEntity4.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], TestEntity4.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (t) { return TestEntity3_1.TestEntity3; }, function (entity3) { return entity3.Entity4; }),
        tslib_1.__metadata("design:type", TestEntity3_1.TestEntity3)
    ], TestEntity4.prototype, "Entity3", void 0);
    TestEntity4 = tslib_1.__decorate([
        src_1.Entity()
    ], TestEntity4);
    return TestEntity4;
}());
exports.TestEntity4 = TestEntity4;
//# sourceMappingURL=TestEntity4.js.map