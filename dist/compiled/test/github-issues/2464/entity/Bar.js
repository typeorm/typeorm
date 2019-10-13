"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Foo_1 = require("./Foo");
var Bar = /** @class */ (function (_super) {
    tslib_1.__extends(Bar, _super);
    function Bar() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Bar.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Bar.prototype, "description", void 0);
    tslib_1.__decorate([
        src_1.ManyToMany(function (type) { return Foo_1.Foo; }, function (foo) { return foo.bars; }),
        tslib_1.__metadata("design:type", Array)
    ], Bar.prototype, "foos", void 0);
    Bar = tslib_1.__decorate([
        Entity_1.Entity()
    ], Bar);
    return Bar;
}(src_1.BaseEntity));
exports.Bar = Bar;
//# sourceMappingURL=Bar.js.map