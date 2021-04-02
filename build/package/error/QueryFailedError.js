"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryFailedError = void 0;
var tslib_1 = require("tslib");
var ObjectUtils_1 = require("../util/ObjectUtils");
/**
 * Thrown when query execution has failed.
*/
var QueryFailedError = /** @class */ (function (_super) {
    tslib_1.__extends(QueryFailedError, _super);
    function QueryFailedError(query, parameters, driverError) {
        var _this = _super.call(this) || this;
        Object.setPrototypeOf(_this, QueryFailedError.prototype);
        _this.message = driverError.toString()
            .replace(/^error: /, "")
            .replace(/^Error: /, "")
            .replace(/^Request/, "");
        ObjectUtils_1.ObjectUtils.assign(_this, tslib_1.__assign(tslib_1.__assign({}, driverError), { name: "QueryFailedError", query: query, parameters: parameters || [] }));
        return _this;
    }
    return QueryFailedError;
}(Error));
exports.QueryFailedError = QueryFailedError;

//# sourceMappingURL=QueryFailedError.js.map
