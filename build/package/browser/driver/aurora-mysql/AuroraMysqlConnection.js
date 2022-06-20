import { DataSource } from "../../data-source/DataSource";
/**
 * Organizes communication with MySQL DBMS.
 */
export class AuroraMysqlConnection extends DataSource {
    constructor(options, queryRunner) {
        super(options);
        this.queryRunner = queryRunner;
    }
    createQueryRunner(mode) {
        return this.queryRunner;
    }
}

//# sourceMappingURL=AuroraMysqlConnection.js.map
