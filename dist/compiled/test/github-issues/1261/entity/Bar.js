"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var BaseEntity_1 = require("../../../../src/repository/BaseEntity");
var OneToOne_1 = require("../../../../src/decorator/relations/OneToOne");
var Foo_1 = require("./Foo");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var Bar = /** @class */ (function (_super) {
    tslib_1.__extends(Bar, _super);
    function Bar() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Bar.prototype, "id", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Foo_1.Foo; }, {
            onDelete: "SET NULL"
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Foo_1.Foo)
    ], Bar.prototype, "foo", void 0);
    Bar = tslib_1.__decorate([
        Entity_1.Entity()
    ], Bar);
    return Bar;
}(BaseEntity_1.BaseEntity));
exports.Bar = Bar;
//# sourceMappingURL=Bar.js.map