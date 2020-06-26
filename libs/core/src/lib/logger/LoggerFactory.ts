import {
    Logger,
    LoggerFactory as BrowserLoggerFactory,
    LoggerOptions,
    SimpleConsoleLogger
} from "@typeorm/browser-core";
import { FileLogger } from "./FileLogger";
import { DebugLogger } from "./DebugLogger";
import { AdvancedConsoleLogger } from './AdvancedConsoleLogger';

/**
 * Helps to create logger instances.
 */
export class LoggerFactory implements BrowserLoggerFactory {

    /**
     * Creates a new logger depend on a given connection's driver.
     */
    create(logger?: "advanced-console" | "simple-console" | "file" | "debug" | Logger | string, options?: LoggerOptions): Logger {
        if (logger instanceof Object)
            return logger as Logger;

        if (logger) {
            switch (logger) {
                case "simple-console":
                    return new SimpleConsoleLogger(options);

                case "file":
                    return new FileLogger(options);

                case "advanced-console":
                    return new AdvancedConsoleLogger(options);

                case "debug":
                    return new DebugLogger();
            }
        }

        return new AdvancedConsoleLogger(options);
    }

}
