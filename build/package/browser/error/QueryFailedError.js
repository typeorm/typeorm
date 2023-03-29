import { __assign, __extends } from "tslib";
import { ObjectUtils } from "../util/ObjectUtils";
/**
 * Thrown when query execution has failed.
*/
var QueryFailedError = /** @class */ (function (_super) {
    __extends(QueryFailedError, _super);
    function QueryFailedError(query, parameters, driverError) {
        var _this = _super.call(this) || this;
        Object.setPrototypeOf(_this, QueryFailedError.prototype);
        _this.message = driverError.toString()
            .replace(/^error: /, "")
            .replace(/^Error: /, "")
            .replace(/^Request/, "");
        ObjectUtils.assign(_this, __assign(__assign({}, driverError), { name: "QueryFailedError", query: query, parameters: parameters || [] }));
        return _this;
    }
    return QueryFailedError;
}(Error));
export { QueryFailedError };

//# sourceMappingURL=QueryFailedError.js.map
