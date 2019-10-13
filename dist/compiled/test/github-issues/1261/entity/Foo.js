"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var BaseEntity_1 = require("../../../../src/repository/BaseEntity");
var Foo = /** @class */ (function (_super) {
    tslib_1.__extends(Foo, _super);
    function Foo() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Foo.prototype, "id", void 0);
    Foo = tslib_1.__decorate([
        Entity_1.Entity()
    ], Foo);
    return Foo;
}(BaseEntity_1.BaseEntity));
exports.Foo = Foo;
//# sourceMappingURL=Foo.js.map