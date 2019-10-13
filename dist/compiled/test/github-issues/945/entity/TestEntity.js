"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var TestEntity = /** @class */ (function () {
    function TestEntity() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], TestEntity.prototype, "id1", void 0);
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], TestEntity.prototype, "id2", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], TestEntity.prototype, "name", void 0);
    TestEntity = tslib_1.__decorate([
        Entity_1.Entity("test_entity")
    ], TestEntity);
    return TestEntity;
}());
exports.TestEntity = TestEntity;
//# sourceMappingURL=TestEntity.js.map