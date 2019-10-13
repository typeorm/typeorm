import { AuroraDataApiQueryRunner } from "./AuroraDataApiQueryRunner";
import { Connection } from "../../connection/Connection";
import { ConnectionOptions, QueryRunner } from "../..";
/**
 * Organizes communication with MySQL DBMS.
 */
export declare class AuroraDataApiConnection extends Connection {
    queryRunnter: AuroraDataApiQueryRunner;
    constructor(options: ConnectionOptions, queryRunner: AuroraDataApiQueryRunner);
    createQueryRunner(mode?: "master" | "slave"): QueryRunner;
}
