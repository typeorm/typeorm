"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuroraMysqlConnection = void 0;
const DataSource_1 = require("../../data-source/DataSource");
/**
 * Organizes communication with MySQL DBMS.
 */
class AuroraMysqlConnection extends DataSource_1.DataSource {
    constructor(options, queryRunner) {
        super(options);
        this.queryRunner = queryRunner;
    }
    createQueryRunner(mode) {
        return this.queryRunner;
    }
}
exports.AuroraMysqlConnection = AuroraMysqlConnection;

//# sourceMappingURL=AuroraMysqlConnection.js.map
