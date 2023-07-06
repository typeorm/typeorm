"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuroraDataApiConnection = void 0;
const Connection_1 = require("../../connection/Connection");
/**
 * Organizes communication with MySQL DBMS.
 */
class AuroraDataApiConnection extends Connection_1.Connection {
    constructor(options, queryRunner) {
        super(options);
        this.queryRunnter = queryRunner;
    }
    createQueryRunner(mode) {
        return this.queryRunnter;
    }
}
exports.AuroraDataApiConnection = AuroraDataApiConnection;
//# sourceMappingURL=AuroraDataApiConnection.js.map