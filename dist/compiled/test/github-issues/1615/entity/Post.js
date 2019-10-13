"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var FooEntity = /** @class */ (function () {
    function FooEntity() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], FooEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column("datetime2", { precision: 0 }),
        tslib_1.__metadata("design:type", Date)
    ], FooEntity.prototype, "date", void 0);
    FooEntity = tslib_1.__decorate([
        src_1.Entity("Foo")
    ], FooEntity);
    return FooEntity;
}());
exports.FooEntity = FooEntity;
//# sourceMappingURL=Post.js.map