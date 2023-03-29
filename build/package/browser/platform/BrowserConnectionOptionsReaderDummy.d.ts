/**
 * Dummy class for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
export declare class ConnectionOptionsEnvReader {
    read(): Promise<void>;
}
/**
 * Dummy class for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
export declare class ConnectionOptionsXmlReader {
    read(path: string): Promise<void>;
}
/**
 * Dummy class for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
export declare class ConnectionOptionsYmlReader {
    read(path: string): Promise<void>;
}
/**
 * Dummy class for replacement via `package.json` in browser builds.
 *
 * If we don't include these functions typeorm will throw an error on runtime
 * as well as during webpack builds.
 */
export declare class ConnectionOptionsReader {
    all(): Promise<void>;
    get(): Promise<void>;
    has(): Promise<void>;
}
