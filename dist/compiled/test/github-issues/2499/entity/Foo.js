"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Foo = /** @class */ (function () {
    function Foo() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Foo.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Foo.prototype, "description", void 0);
    Foo = tslib_1.__decorate([
        Entity_1.Entity("foo")
    ], Foo);
    return Foo;
}());
exports.Foo = Foo;
//# sourceMappingURL=Foo.js.map