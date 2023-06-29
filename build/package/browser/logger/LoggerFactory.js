import { SimpleConsoleLogger } from "./SimpleConsoleLogger";
import { AdvancedConsoleLogger } from "./AdvancedConsoleLogger";
import { FileLogger } from "./FileLogger";
import { DebugLogger } from "./DebugLogger";
/**
 * Helps to create logger instances.
 */
export class LoggerFactory {
    /**
     * Creates a new logger depend on a given connection's driver.
     */
    create(logger, options) {
        if (logger instanceof Object)
            return logger;
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

//# sourceMappingURL=LoggerFactory.js.map
