"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingJoinTableError = void 0;
var tslib_1 = require("tslib");
/**
 */
var MissingJoinTableError = /** @class */ (function (_super) {
    tslib_1.__extends(MissingJoinTableError, _super);
    function MissingJoinTableError(entityMetadata, relation) {
        var _this = _super.call(this) || this;
        _this.name = "MissingJoinTableError";
        Object.setPrototypeOf(_this, MissingJoinTableError.prototype);
        if (relation.inverseRelation) {
            _this.message = "JoinTable is missing on both sides of " + entityMetadata.name + "#" + relation.propertyName + " and " +
                (relation.inverseEntityMetadata.name + "#" + relation.inverseRelation.propertyName + " many-to-many relationship. ") +
                "You need to put decorator decorator on one of the sides.";
        }
        else {
            _this.message = "JoinTable is missing on " + entityMetadata.name + "#" + relation.propertyName + " many-to-many relationship. " +
                "You need to put JoinTable decorator on it.";
        }
        return _this;
    }
    return MissingJoinTableError;
}(Error));
exports.MissingJoinTableError = MissingJoinTableError;

//# sourceMappingURL=MissingJoinTableError.js.map
