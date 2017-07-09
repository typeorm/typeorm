import {QueryRunner} from "../query-runner/QueryRunner";
/**
 * Logging options.
 */
export interface LoggerOptions {

    /**
     * Some specific logger to be used. By default it is a console.
     */
    readonly logger?: (level: string, message: any, queryRunner?: QueryRunner) => void;

}