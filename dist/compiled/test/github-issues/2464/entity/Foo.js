"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Bar_1 = require("./Bar");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Foo = /** @class */ (function (_super) {
    tslib_1.__extends(Foo, _super);
    function Foo() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Foo.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.JoinTable(),
        src_1.ManyToMany(function () { return Bar_1.Bar; }, function (bar) { return bar.foos; }, {
            cascade: ["insert", "update"],
            onDelete: "NO ACTION"
        }),
        tslib_1.__metadata("design:type", Array)
    ], Foo.prototype, "bars", void 0);
    tslib_1.__decorate([
        src_1.JoinTable(),
        src_1.ManyToMany(function () { return Bar_1.Bar; }, function (bar) { return bar.foos; }, {
            cascade: ["insert", "update"],
        }),
        tslib_1.__metadata("design:type", Array)
    ], Foo.prototype, "otherBars", void 0);
    Foo = tslib_1.__decorate([
        Entity_1.Entity("foo")
    ], Foo);
    return Foo;
}(src_1.BaseEntity));
exports.Foo = Foo;
//# sourceMappingURL=Foo.js.map