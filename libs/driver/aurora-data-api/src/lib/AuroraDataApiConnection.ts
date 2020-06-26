import { AuroraDataApiQueryRunner } from "./AuroraDataApiQueryRunner";
import { Connection, ConnectionOptions, QueryRunner } from "@typeorm/core";

/**
 * Organizes communication with MySQL DBMS.
 */
export class AuroraDataApiConnection extends Connection {
    queryRunnter: AuroraDataApiQueryRunner;

    constructor(options: ConnectionOptions, queryRunner: AuroraDataApiQueryRunner) {
        super(options);
        this.queryRunnter = queryRunner;
    }

    public createQueryRunner(mode: "master" | "slave" = "master"): QueryRunner {
        return this.queryRunnter;
    }

}
