"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var BaseContent = /** @class */ (function () {
    function BaseContent() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], BaseContent.prototype, "id", void 0);
    return BaseContent;
}());
exports.BaseContent = BaseContent;
//# sourceMappingURL=BaseContent.js.map