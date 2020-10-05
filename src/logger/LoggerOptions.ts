/**
 * Logging options.
 */
export type LoggerOptions = boolean|"all"|("query"|"schema"|"error"|"warn"|"info"|"log"|"migration")[];

/**
 * File logging option.
 */
export type FileLoggerOptions = {
  /**
   * Specify custom path for log file, relative to application root
   */
  logPath: string;
};
