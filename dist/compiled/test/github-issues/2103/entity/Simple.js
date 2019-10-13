"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Simple = /** @class */ (function () {
    function Simple() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Simple.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Simple.prototype, "x", void 0);
    Simple = tslib_1.__decorate([
        src_1.Entity()
    ], Simple);
    return Simple;
}());
exports.Simple = Simple;
//# sourceMappingURL=Simple.js.map