"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var DefaultNamingStrategy_1 = require("../../../../src/naming-strategy/DefaultNamingStrategy");
var SecondCustomNamingStrategy = /** @class */ (function (_super) {
    tslib_1.__extends(SecondCustomNamingStrategy, _super);
    function SecondCustomNamingStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SecondCustomNamingStrategy.prototype.tableName = function (className, customName) {
        return customName ? customName.toLowerCase() : className.toLowerCase();
    };
    return SecondCustomNamingStrategy;
}(DefaultNamingStrategy_1.DefaultNamingStrategy));
exports.SecondCustomNamingStrategy = SecondCustomNamingStrategy;
//# sourceMappingURL=SecondCustomNamingStrategy.js.map