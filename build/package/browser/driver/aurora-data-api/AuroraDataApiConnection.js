import { __extends } from "tslib";
import { Connection } from "../../connection/Connection";
/**
 * Organizes communication with MySQL DBMS.
 */
var AuroraDataApiConnection = /** @class */ (function (_super) {
    __extends(AuroraDataApiConnection, _super);
    function AuroraDataApiConnection(options, queryRunner) {
        var _this = _super.call(this, options) || this;
        _this.queryRunnter = queryRunner;
        return _this;
    }
    AuroraDataApiConnection.prototype.createQueryRunner = function (mode) {
        return this.queryRunnter;
    };
    return AuroraDataApiConnection;
}(Connection));
export { AuroraDataApiConnection };

//# sourceMappingURL=AuroraDataApiConnection.js.map
