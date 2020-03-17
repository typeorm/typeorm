/**
 * Describes all temporal table options.
 */
export interface TemporalOptions {

  /**
   * Historical table name. The default would be table name + '_historical' suffix.
   * NOTE: Seperate historical tables are NOT supported in mariaDB
   */
  historicalTableName?: string;

  /**
   * System Start time column name.
   * The DB uses this columns to sets the value for the SysStartTime column to the begin time of the current
   * transaction.
   */
  sysStartTimeColumnName?: string;

  /**
   * The DB sets the value for the SysStartTime column to the begin time of the current transaction (in the UTC time zone) based on the system clock which uses GETUTCDATE() function by default, you user wants to use custom function or doesn't need UTC time he can pass function name as a parameter.
   */
  getDateFunction?: string;

  /**
   * System End time column name.
   *
   */
  sysEndTimeColumnName?: string;

}
