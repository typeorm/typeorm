"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitializedRelationError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when relation has array initialized which is forbidden my ORM.
 *
 * @see https://github.com/typeorm/typeorm/issues/1319
 * @see http://typeorm.io/#/relations-faq/avoid-relation-property-initializers
 */
var InitializedRelationError = /** @class */ (function (_super) {
    tslib_1.__extends(InitializedRelationError, _super);
    function InitializedRelationError(relation) {
        var _this = _super.call(this) || this;
        Object.setPrototypeOf(_this, InitializedRelationError.prototype);
        _this.message = "Array initializations are not allowed in entity relations. " +
            ("Please remove array initialization (= []) from \"" + relation.entityMetadata.targetName + "#" + relation.propertyPath + "\". ") +
            "This is ORM requirement to make relations to work properly. Refer docs for more information.";
        return _this;
    }
    return InitializedRelationError;
}(Error));
exports.InitializedRelationError = InitializedRelationError;

//# sourceMappingURL=InitializedRelationError.js.map
