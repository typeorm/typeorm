import { Connection } from "./Connection";
import { ConnectionManager as BrowserConnectionManager } from '@typeorm/browser-core'

/**
 * ConnectionManager is used to store and manage multiple orm connections.
 * It also provides useful factory methods to simplify connection creation.
 */
export class ConnectionManager extends BrowserConnectionManager {

    protected connectionCls = Connection;

}
