import {AuroraDataApiQueryRunner} from "./AuroraDataApiQueryRunner";
import {Connection} from "../../connection/Connection";
import {ConnectionOptions, QueryRunner} from "../..";

/**
 * Organizes communication with MySQL DBMS.
 */
export class AuroraDataApiConnection extends Connection {
    queryRunnter: AuroraDataApiQueryRunner;

    constructor(options: ConnectionOptions, queryRunner: AuroraDataApiQueryRunner) {
        super(options);
        this.queryRunnter = queryRunner;
    }

    public createQueryRunner(mode: "master" | "slave" | "primary" | "replica" = "primary"): QueryRunner {
        return this.queryRunnter;
    }

}
