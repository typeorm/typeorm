import { __extends } from "tslib";
/**
 */
var MissingDeleteDateColumnError = /** @class */ (function (_super) {
    __extends(MissingDeleteDateColumnError, _super);
    function MissingDeleteDateColumnError(entityMetadata) {
        var _this = _super.call(this) || this;
        _this.name = "MissingDeleteDateColumnError";
        Object.setPrototypeOf(_this, MissingDeleteDateColumnError.prototype);
        _this.message = "Entity \"" + entityMetadata.name + "\" does not have delete date columns.";
        return _this;
    }
    return MissingDeleteDateColumnError;
}(Error));
export { MissingDeleteDateColumnError };

//# sourceMappingURL=MissingDeleteDateColumnError.js.map
