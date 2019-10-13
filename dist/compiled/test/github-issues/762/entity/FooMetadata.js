"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var FooChildMetadata_1 = require("./FooChildMetadata");
var FooMetadata = /** @class */ (function () {
    function FooMetadata() {
    }
    tslib_1.__decorate([
        Column_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", Number)
    ], FooMetadata.prototype, "bar", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return FooChildMetadata_1.FooChildMetadata; }),
        tslib_1.__metadata("design:type", FooChildMetadata_1.FooChildMetadata)
    ], FooMetadata.prototype, "child", void 0);
    return FooMetadata;
}());
exports.FooMetadata = FooMetadata;
//# sourceMappingURL=FooMetadata.js.map