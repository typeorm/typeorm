"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var PrimaryColumn_1 = require("../../../../../src/decorator/columns/PrimaryColumn");
var PostMultiplePrimaryKeys = /** @class */ (function () {
    function PostMultiplePrimaryKeys() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostMultiplePrimaryKeys.prototype, "firstId", void 0);
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostMultiplePrimaryKeys.prototype, "secondId", void 0);
    tslib_1.__decorate([
        Column_1.Column({ default: "Hello Multi Ids" }),
        tslib_1.__metadata("design:type", String)
    ], PostMultiplePrimaryKeys.prototype, "text", void 0);
    PostMultiplePrimaryKeys = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostMultiplePrimaryKeys);
    return PostMultiplePrimaryKeys;
}());
exports.PostMultiplePrimaryKeys = PostMultiplePrimaryKeys;
//# sourceMappingURL=PostMultiplePrimaryKeys.js.map