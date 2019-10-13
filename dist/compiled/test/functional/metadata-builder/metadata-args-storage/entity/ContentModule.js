"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Unit_1 = require("./Unit");
var ContentModule = /** @class */ (function (_super) {
    tslib_1.__extends(ContentModule, _super);
    function ContentModule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], ContentModule.prototype, "tag", void 0);
    return ContentModule;
}(Unit_1.Unit));
exports.ContentModule = ContentModule;
//# sourceMappingURL=ContentModule.js.map