"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var FooChildMetadata = /** @class */ (function () {
    function FooChildMetadata() {
    }
    tslib_1.__decorate([
        Column_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", Number)
    ], FooChildMetadata.prototype, "something", void 0);
    tslib_1.__decorate([
        Column_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", Number)
    ], FooChildMetadata.prototype, "somethingElse", void 0);
    return FooChildMetadata;
}());
exports.FooChildMetadata = FooChildMetadata;
//# sourceMappingURL=FooChildMetadata.js.map