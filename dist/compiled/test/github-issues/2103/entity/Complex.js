"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Complex = /** @class */ (function () {
    function Complex() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Complex.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Complex.prototype, "code", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Complex.prototype, "x", void 0);
    Complex = tslib_1.__decorate([
        src_1.Entity()
    ], Complex);
    return Complex;
}());
exports.Complex = Complex;
//# sourceMappingURL=Complex.js.map