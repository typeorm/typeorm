"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var DefaultNamingStrategy_1 = require("../../../src/naming-strategy/DefaultNamingStrategy");
var StringUtils_1 = require("../../../src/util/StringUtils");
var CustomNamingStrategy = /** @class */ (function (_super) {
    tslib_1.__extends(CustomNamingStrategy, _super);
    function CustomNamingStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CustomNamingStrategy.prototype.tableName = function (targetName, userSpecifiedName) {
        return userSpecifiedName ? userSpecifiedName : StringUtils_1.snakeCase(targetName);
    };
    CustomNamingStrategy.prototype.columnName = function (propertyName, customName, embeddedPrefixes) {
        return StringUtils_1.snakeCase(embeddedPrefixes.concat(customName ? customName : propertyName).join("_"));
    };
    CustomNamingStrategy.prototype.columnNameCustomized = function (customName) {
        return customName;
    };
    CustomNamingStrategy.prototype.relationName = function (propertyName) {
        return StringUtils_1.snakeCase(propertyName);
    };
    return CustomNamingStrategy;
}(DefaultNamingStrategy_1.DefaultNamingStrategy));
exports.CustomNamingStrategy = CustomNamingStrategy;
//# sourceMappingURL=CustomNamingStrategy.js.map