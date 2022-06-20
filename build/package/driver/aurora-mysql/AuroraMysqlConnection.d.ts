import { AuroraMysqlQueryRunner } from "./AuroraMysqlQueryRunner";
import { DataSource } from "../../data-source/DataSource";
import { ReplicationMode } from "../types/ReplicationMode";
import { DataSourceOptions } from "../../data-source";
import { QueryRunner } from "../../query-runner/QueryRunner";
/**
 * Organizes communication with MySQL DBMS.
 */
export declare class AuroraMysqlConnection extends DataSource {
    queryRunner: AuroraMysqlQueryRunner;
    constructor(options: DataSourceOptions, queryRunner: AuroraMysqlQueryRunner);
    createQueryRunner(mode: ReplicationMode): QueryRunner;
}
