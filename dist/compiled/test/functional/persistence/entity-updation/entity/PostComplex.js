"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var PostEmbedded_1 = require("./PostEmbedded");
var PrimaryColumn_1 = require("../../../../../src/decorator/columns/PrimaryColumn");
var PostComplex = /** @class */ (function () {
    function PostComplex() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostComplex.prototype, "firstId", void 0);
    tslib_1.__decorate([
        Column_1.Column({ default: "Hello Complexity" }),
        tslib_1.__metadata("design:type", String)
    ], PostComplex.prototype, "text", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return PostEmbedded_1.PostEmbedded; }),
        tslib_1.__metadata("design:type", PostEmbedded_1.PostEmbedded)
    ], PostComplex.prototype, "embed", void 0);
    PostComplex = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostComplex);
    return PostComplex;
}());
exports.PostComplex = PostComplex;
//# sourceMappingURL=PostComplex.js.map