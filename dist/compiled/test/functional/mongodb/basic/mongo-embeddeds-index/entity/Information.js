"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var Index_1 = require("../../../../../../src/decorator/Index");
var Information = /** @class */ (function () {
    function Information() {
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Information.prototype, "description", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        Index_1.Index("post_likes"),
        tslib_1.__metadata("design:type", Number)
    ], Information.prototype, "likes", void 0);
    return Information;
}());
exports.Information = Information;
//# sourceMappingURL=Information.js.map