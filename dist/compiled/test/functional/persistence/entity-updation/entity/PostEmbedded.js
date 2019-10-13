"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryColumn_1 = require("../../../../../src/decorator/columns/PrimaryColumn");
var UpdateDateColumn_1 = require("../../../../../src/decorator/columns/UpdateDateColumn");
var CreateDateColumn_1 = require("../../../../../src/decorator/columns/CreateDateColumn");
var VersionColumn_1 = require("../../../../../src/decorator/columns/VersionColumn");
var PostEmbedded = /** @class */ (function () {
    function PostEmbedded() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostEmbedded.prototype, "secondId", void 0);
    tslib_1.__decorate([
        CreateDateColumn_1.CreateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], PostEmbedded.prototype, "createDate", void 0);
    tslib_1.__decorate([
        UpdateDateColumn_1.UpdateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], PostEmbedded.prototype, "updateDate", void 0);
    tslib_1.__decorate([
        VersionColumn_1.VersionColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostEmbedded.prototype, "version", void 0);
    return PostEmbedded;
}());
exports.PostEmbedded = PostEmbedded;
//# sourceMappingURL=PostEmbedded.js.map