"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Unit_1 = require("./Unit");
var Content = /** @class */ (function (_super) {
    tslib_1.__extends(Content, _super);
    function Content() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Content.prototype, "name", void 0);
    return Content;
}(Unit_1.Unit));
exports.Content = Content;
//# sourceMappingURL=Content.js.map