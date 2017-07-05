import {QueryRunner} from "../query-runner/QueryRunner";
/**
 * Logging options.
 */
export interface LoggerOptions {

    /**
     * Some specific logger to be used. By default it is a console.
     */
    readonly logger?: (level: string, message: any, queryRunner?: QueryRunner) => void;

    /**
     * Set to true if you want to log every executed query.
     */
    readonly logQueries?: boolean;

    /**
     * Set to true if you want to log only failed query.
     */
    readonly logOnlyFailedQueries?: boolean;

    /**
     * Set to true if you want to log error of the failed query.
     */
    readonly logFailedQueryError?: boolean;

    /**
     * If set to true then schema creation logs will be logged.
     */
    readonly logSchemaCreation?: boolean;

}