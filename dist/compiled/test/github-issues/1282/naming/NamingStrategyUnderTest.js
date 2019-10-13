"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var DefaultNamingStrategy_1 = require("../../../../src/naming-strategy/DefaultNamingStrategy");
var StringUtils_1 = require("../../../../src/util/StringUtils");
var NamingStrategyUnderTest = /** @class */ (function (_super) {
    tslib_1.__extends(NamingStrategyUnderTest, _super);
    function NamingStrategyUnderTest() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.calledJoinTableColumnName = [];
        _this.calledJoinTableInverseColumnName = [];
        return _this;
    }
    NamingStrategyUnderTest.prototype.joinTableColumnName = function (tableName, propertyName, columnName) {
        this.calledJoinTableColumnName.push(true);
        return StringUtils_1.camelCase(tableName + "_" + (columnName ? columnName : propertyName) + "_forward");
    };
    NamingStrategyUnderTest.prototype.joinTableInverseColumnName = function (tableName, propertyName, columnName) {
        this.calledJoinTableInverseColumnName.push(true);
        return StringUtils_1.camelCase(tableName + "_" + (columnName ? columnName : propertyName) + "_inverse");
    };
    return NamingStrategyUnderTest;
}(DefaultNamingStrategy_1.DefaultNamingStrategy));
exports.NamingStrategyUnderTest = NamingStrategyUnderTest;
//# sourceMappingURL=NamingStrategyUnderTest.js.map