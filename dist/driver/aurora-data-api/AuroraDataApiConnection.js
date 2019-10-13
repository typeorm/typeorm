"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Connection_1 = require("../../connection/Connection");
/**
 * Organizes communication with MySQL DBMS.
 */
var AuroraDataApiConnection = /** @class */ (function (_super) {
    tslib_1.__extends(AuroraDataApiConnection, _super);
    function AuroraDataApiConnection(options, queryRunner) {
        var _this = _super.call(this, options) || this;
        _this.queryRunnter = queryRunner;
        return _this;
    }
    AuroraDataApiConnection.prototype.createQueryRunner = function (mode) {
        if (mode === void 0) { mode = "master"; }
        return this.queryRunnter;
    };
    return AuroraDataApiConnection;
}(Connection_1.Connection));
exports.AuroraDataApiConnection = AuroraDataApiConnection;
//# sourceMappingURL=AuroraDataApiConnection.js.map