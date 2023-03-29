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
var MongoDriver = /** @class */ (function () {
    function MongoDriver() {
    }
    return MongoDriver;
}());
export { MongoDriver };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var MongoQueryRunner = /** @class */ (function () {
    function MongoQueryRunner() {
    }
    return MongoQueryRunner;
}());
export { MongoQueryRunner };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var MongoEntityManager = /** @class */ (function () {
    function MongoEntityManager() {
    }
    return MongoEntityManager;
}());
export { MongoEntityManager };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var MongoRepository = /** @class */ (function () {
    function MongoRepository() {
    }
    return MongoRepository;
}());
export { MongoRepository };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var PostgresDriver = /** @class */ (function () {
    function PostgresDriver() {
    }
    return PostgresDriver;
}());
export { PostgresDriver };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var AuroraDataApiDriver = /** @class */ (function () {
    function AuroraDataApiDriver() {
    }
    return AuroraDataApiDriver;
}());
export { AuroraDataApiDriver };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var CockroachDriver = /** @class */ (function () {
    function CockroachDriver() {
    }
    return CockroachDriver;
}());
export { CockroachDriver };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var AuroraDataApiPostgresDriver = /** @class */ (function () {
    function AuroraDataApiPostgresDriver() {
    }
    return AuroraDataApiPostgresDriver;
}());
export { AuroraDataApiPostgresDriver };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var SqlServerDriver = /** @class */ (function () {
    function SqlServerDriver() {
    }
    return SqlServerDriver;
}());
export { SqlServerDriver };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var SapDriver = /** @class */ (function () {
    function SapDriver() {
    }
    return SapDriver;
}());
export { SapDriver };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var MysqlDriver = /** @class */ (function () {
    function MysqlDriver() {
    }
    return MysqlDriver;
}());
export { MysqlDriver };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var OracleDriver = /** @class */ (function () {
    function OracleDriver() {
    }
    return OracleDriver;
}());
export { OracleDriver };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var SqliteDriver = /** @class */ (function () {
    function SqliteDriver() {
    }
    return SqliteDriver;
}());
export { SqliteDriver };
/**
 * DO NOT IMPORT THIS CLASS -
 * This is a dummy class for replacement via `package.json` in browser builds
 */
var BetterSqlite3Driver = /** @class */ (function () {
    function BetterSqlite3Driver() {
    }
    return BetterSqlite3Driver;
}());
export { BetterSqlite3Driver };

//# sourceMappingURL=BrowserDisabledDriversDummy.js.map
