import { BaseConnectionOptions } from "../../connection/BaseConnectionOptions";
export interface IgniteConnectionOptions extends BaseConnectionOptions {
  readonly type: "ignite";

  /**
   * @example
   * 127.0.0.1:10800
   */
  readonly endpoint: string | string[];
  /**
   * ignite cacheName
   */
  readonly database: string;
}
