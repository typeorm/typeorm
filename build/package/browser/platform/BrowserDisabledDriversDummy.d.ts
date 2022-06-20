/**
 * Dummy driver classes for replacement via `package.json` in browser builds.
 * Using those classes reduces the build size by one third.
 *
 * If we don't include those dummy classes (and just disable the driver import
 * with `false` in `package.json`) typeorm will throw an error on runtime and
 * during webpack builds even if those driver are not used.
 */
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class MongoDriver {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class MongoQueryRunner {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class MongoEntityManager {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class MongoRepository {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class PostgresDriver {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class AuroraMysqlDriver {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class CockroachDriver {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class AuroraPostgresDriver {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class SqlServerDriver {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class SapDriver {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class MysqlDriver {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class OracleDriver {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class SqliteDriver {
}
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
export declare class BetterSqlite3Driver {
}
