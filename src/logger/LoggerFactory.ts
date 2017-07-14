import {LoggerOptions} from "./LoggerOptions";
import {Logger} from "./Logger";

/**
 * Helps to create logger instances.
 */
export class LoggerFactory {

    /**
     * Creates a new logger depend on a given connection's driver.
     */
    create(options: LoggerOptions): Logger {
        return new Logger(options);
    }

}