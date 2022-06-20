import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { CapacitorDriver } from "./CapacitorDriver";
import { ObjectLiteral } from "../../common/ObjectLiteral";
/**
 * Runs queries on a single sqlite database connection.
 */
export declare class CapacitorQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: CapacitorDriver;
    constructor(driver: CapacitorDriver);
    /**
     * Called before migrations are run.
     */
    beforeMigration(): Promise<void>;
    /**
     * Called after migrations are run.
     */
    afterMigration(): Promise<void>;
    executeSet(set: {
        statement: string;
        values?: any[];
    }[]): Promise<any>;
    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[], useStructuredResult?: boolean): Promise<any>;
    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral): string[];
}
