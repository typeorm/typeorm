"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Personalization = /** @class */ (function () {
    function Personalization() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", Number)
    ], Personalization.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Personalization.prototype, "logo", void 0);
    Personalization = tslib_1.__decorate([
        src_1.Entity()
    ], Personalization);
    return Personalization;
}());
exports.Personalization = Personalization;
//# sourceMappingURL=Personalization.js.map