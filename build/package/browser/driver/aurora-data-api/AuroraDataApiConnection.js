import { Connection } from "../../connection/Connection";
/**
 * Organizes communication with MySQL DBMS.
 */
export class AuroraDataApiConnection extends Connection {
    constructor(options, queryRunner) {
        super(options);
        this.queryRunnter = queryRunner;
    }
    createQueryRunner(mode) {
        return this.queryRunnter;
    }
}

//# sourceMappingURL=AuroraDataApiConnection.js.map
