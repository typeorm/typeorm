"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var PrimaryColumn_1 = require("../../../../../src/decorator/columns/PrimaryColumn");
var PostBigInt = /** @class */ (function () {
    function PostBigInt() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostBigInt.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostBigInt.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column("bigint", {
            unsigned: true
        }),
        tslib_1.__metadata("design:type", String)
    ], PostBigInt.prototype, "counter", void 0);
    PostBigInt = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostBigInt);
    return PostBigInt;
}());
exports.PostBigInt = PostBigInt;
//# sourceMappingURL=PostBigInt.js.map