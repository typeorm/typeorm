"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryColumn_1 = require("../../../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var PostWithoutTypes = /** @class */ (function () {
    function PostWithoutTypes() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostWithoutTypes.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostWithoutTypes.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], PostWithoutTypes.prototype, "bit", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Buffer)
    ], PostWithoutTypes.prototype, "binary", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Date)
    ], PostWithoutTypes.prototype, "datetime", void 0);
    PostWithoutTypes = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostWithoutTypes);
    return PostWithoutTypes;
}());
exports.PostWithoutTypes = PostWithoutTypes;
//# sourceMappingURL=PostWithoutTypes.js.map