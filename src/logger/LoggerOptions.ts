/**
 * Logging options.
 */
type LogLevel = ("query"|"schema"|"error"|"warn"|"info"|"log"|"migration");
export type LoggerOptions = boolean|"all"|LogLevel[];

/**
 * File logging option.
 */
export type FileLoggerOptions = {
  /**
   * Specify custom path for log file, relative to application root
   */
  logPath: string;
};

/**
 * Helper function to determine if a message at a particular log level should be logged given the options
 */
export function shouldLog(
  logLevel: LogLevel,
  options: LoggerOptions | undefined
): boolean {
  return (
    options === "all" ||
    options === true ||
    (Array.isArray(options) && options.indexOf(logLevel) !== -1)
  );
}
