"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryRunnerAlreadyReleasedError = void 0;
var tslib_1 = require("tslib");
/**
 */
var QueryRunnerAlreadyReleasedError = /** @class */ (function (_super) {
    tslib_1.__extends(QueryRunnerAlreadyReleasedError, _super);
    function QueryRunnerAlreadyReleasedError() {
        var _this = _super.call(this) || this;
        _this.name = "QueryRunnerAlreadyReleasedError";
        Object.setPrototypeOf(_this, QueryRunnerAlreadyReleasedError.prototype);
        _this.message = "Query runner already released. Cannot run queries anymore.";
        return _this;
    }
    return QueryRunnerAlreadyReleasedError;
}(Error));
exports.QueryRunnerAlreadyReleasedError = QueryRunnerAlreadyReleasedError;

//# sourceMappingURL=QueryRunnerAlreadyReleasedError.js.map
