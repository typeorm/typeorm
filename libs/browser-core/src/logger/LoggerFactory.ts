import { Logger } from "./Logger";
import { LoggerOptions } from "./LoggerOptions";
import { SimpleConsoleLogger } from "./SimpleConsoleLogger";

/**
 * Helps to create logger instances.
 */
export class LoggerFactory {

    /**
     * Creates a new logger depend on a given connection's driver.
     */
    create(logger?: "advanced-console" | "simple-console" | "file" | "debug" | Logger | string, options?: LoggerOptions): Logger {
        if (logger instanceof Object)
            return logger as Logger;

        return new SimpleConsoleLogger(options);
    }

}
