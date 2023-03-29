"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsingJoinColumnOnlyOnOneSideAllowedError = void 0;
var tslib_1 = require("tslib");
/**
 */
var UsingJoinColumnOnlyOnOneSideAllowedError = /** @class */ (function (_super) {
    tslib_1.__extends(UsingJoinColumnOnlyOnOneSideAllowedError, _super);
    function UsingJoinColumnOnlyOnOneSideAllowedError(entityMetadata, relation) {
        var _this = _super.call(this) || this;
        _this.name = "UsingJoinColumnOnlyOnOneSideAllowedError";
        Object.setPrototypeOf(_this, UsingJoinColumnOnlyOnOneSideAllowedError.prototype);
        _this.message = "Using JoinColumn is allowed only on one side of the one-to-one relationship. " +
            ("Both " + entityMetadata.name + "#" + relation.propertyName + " and " + relation.inverseEntityMetadata.name + "#" + relation.inverseRelation.propertyName + " ") +
            "has JoinTable decorators. Choose one of them and left JoinTable decorator only on it.";
        return _this;
    }
    return UsingJoinColumnOnlyOnOneSideAllowedError;
}(Error));
exports.UsingJoinColumnOnlyOnOneSideAllowedError = UsingJoinColumnOnlyOnOneSideAllowedError;

//# sourceMappingURL=UsingJoinColumnOnlyOnOneSideAllowedError.js.map
