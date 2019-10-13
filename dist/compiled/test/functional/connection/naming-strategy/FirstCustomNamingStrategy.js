"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var DefaultNamingStrategy_1 = require("../../../../src/naming-strategy/DefaultNamingStrategy");
var FirstCustomNamingStrategy = /** @class */ (function (_super) {
    tslib_1.__extends(FirstCustomNamingStrategy, _super);
    function FirstCustomNamingStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FirstCustomNamingStrategy.prototype.tableName = function (className, customName) {
        return customName ? customName.toUpperCase() : className.toUpperCase();
    };
    return FirstCustomNamingStrategy;
}(DefaultNamingStrategy_1.DefaultNamingStrategy));
exports.FirstCustomNamingStrategy = FirstCustomNamingStrategy;
//# sourceMappingURL=FirstCustomNamingStrategy.js.map