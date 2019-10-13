"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Personalization_1 = require("./Personalization");
var Provider = /** @class */ (function () {
    function Provider() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Provider.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Provider.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Provider.prototype, "description", void 0);
    tslib_1.__decorate([
        src_1.OneToOne(function (_) { return Personalization_1.Personalization; }),
        src_1.JoinColumn(),
        tslib_1.__metadata("design:type", Personalization_1.Personalization)
    ], Provider.prototype, "personalization", void 0);
    Provider = tslib_1.__decorate([
        src_1.Entity()
    ], Provider);
    return Provider;
}());
exports.Provider = Provider;
//# sourceMappingURL=Provider.js.map