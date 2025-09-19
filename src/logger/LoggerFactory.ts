import { Logger } from "./Logger"
import { LoggerOptions } from "./LoggerOptions"
import { SimpleConsoleLogger } from "./SimpleConsoleLogger"
import { AdvancedConsoleLogger } from "./AdvancedConsoleLogger"
import { FileLogger } from "./FileLogger"
import { DebugLogger } from "./DebugLogger"
import { ObjectUtils } from "../util/ObjectUtils"
import { FormattedConsoleLogger } from "./FormattedConsoleLogger"

/**
 * Helps to create logger instances.
 */
export class LoggerFactory {
    /**
     * Creates a new logger depend on a given connection's driver.
     */
    create(
        logger?:
            | "advanced-console"
            | "simple-console"
            | "formatted-console"
            | "file"
            | "debug"
            | Logger,
        options?: LoggerOptions,
    ): Logger {
        if (ObjectUtils.isObject(logger)) return logger as Logger

        if (logger) {
            switch (logger) {
                case "simple-console":
                    return new SimpleConsoleLogger(options)

                case "file":
                    return new FileLogger(options)

                case "advanced-console":
                    return new AdvancedConsoleLogger(options)

                case "formatted-console":
                    return new FormattedConsoleLogger(options)

                case "debug":
                    return new DebugLogger()
            }
        }

        return new AdvancedConsoleLogger(options)
    }
}
