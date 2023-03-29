import { __extends } from "tslib";
/**
 * Thrown when consumer tries to use query runner from query runner provider after it was released.
 */
var QueryRunnerProviderAlreadyReleasedError = /** @class */ (function (_super) {
    __extends(QueryRunnerProviderAlreadyReleasedError, _super);
    function QueryRunnerProviderAlreadyReleasedError() {
        var _this = _super.call(this) || this;
        _this.name = "QueryRunnerProviderAlreadyReleasedError";
        Object.setPrototypeOf(_this, QueryRunnerProviderAlreadyReleasedError.prototype);
        _this.message = "Database connection provided by a query runner was already released, cannot continue to use its querying methods anymore.";
        return _this;
    }
    return QueryRunnerProviderAlreadyReleasedError;
}(Error));
export { QueryRunnerProviderAlreadyReleasedError };

//# sourceMappingURL=QueryRunnerProviderAlreadyReleasedError.js.map
