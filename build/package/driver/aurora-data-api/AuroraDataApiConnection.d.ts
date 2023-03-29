import { AuroraDataApiQueryRunner } from "./AuroraDataApiQueryRunner";
import { Connection } from "../../connection/Connection";
import { ConnectionOptions, QueryRunner } from "../..";
import { ReplicationMode } from "../types/ReplicationMode";
/**
 * Organizes communication with MySQL DBMS.
 */
export declare class AuroraDataApiConnection extends Connection {
    queryRunnter: AuroraDataApiQueryRunner;
    constructor(options: ConnectionOptions, queryRunner: AuroraDataApiQueryRunner);
    createQueryRunner(mode: ReplicationMode): QueryRunner;
}
