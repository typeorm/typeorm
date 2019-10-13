"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Bar = /** @class */ (function () {
    function Bar() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Bar.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Bar.prototype, "description", void 0);
    Bar = tslib_1.__decorate([
        Entity_1.Entity("bar")
    ], Bar);
    return Bar;
}());
exports.Bar = Bar;
//# sourceMappingURL=Bar.js.map