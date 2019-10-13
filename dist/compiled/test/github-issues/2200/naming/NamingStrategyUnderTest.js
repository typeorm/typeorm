"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var DefaultNamingStrategy_1 = require("../../../../src/naming-strategy/DefaultNamingStrategy");
var NamingStrategyUnderTest = /** @class */ (function (_super) {
    tslib_1.__extends(NamingStrategyUnderTest, _super);
    function NamingStrategyUnderTest() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NamingStrategyUnderTest.prototype.eagerJoinRelationAlias = function (alias, propertyPath) {
        return alias + "__" + propertyPath.replace(".", "_");
    };
    return NamingStrategyUnderTest;
}(DefaultNamingStrategy_1.DefaultNamingStrategy));
exports.NamingStrategyUnderTest = NamingStrategyUnderTest;
//# sourceMappingURL=NamingStrategyUnderTest.js.map