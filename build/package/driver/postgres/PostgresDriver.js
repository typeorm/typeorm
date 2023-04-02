"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresDriver = void 0;
var tslib_1 = require("tslib");
var ConnectionIsNotSetError_1 = require("../../error/ConnectionIsNotSetError");
var DriverPackageNotInstalledError_1 = require("../../error/DriverPackageNotInstalledError");
var PostgresQueryRunner_1 = require("./PostgresQueryRunner");
var DateUtils_1 = require("../../util/DateUtils");
var PlatformTools_1 = require("../../platform/PlatformTools");
var RdbmsSchemaBuilder_1 = require("../../schema-builder/RdbmsSchemaBuilder");
var OrmUtils_1 = require("../../util/OrmUtils");
var ApplyValueTransformers_1 = require("../../util/ApplyValueTransformers");
/**
 * Organizes communication with PostgreSQL DBMS.
 */
var PostgresDriver = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function PostgresDriver(connection) {
        /**
         * Pool for slave databases.
         * Used in replication.
         */
        this.slaves = [];
        /**
         * We store all created query runners because we need to release them.
         */
        this.connectedQueryRunners = [];
        /**
         * Indicates if replication is enabled.
         */
        this.isReplicated = false;
        /**
         * Indicates if tree tables are supported by this driver.
         */
        this.treeSupport = true;
        /**
         * Gets list of supported column data types by a driver.
         *
         * @see https://www.tutorialspoint.com/postgresql/postgresql_data_types.htm
         * @see https://www.postgresql.org/docs/9.2/static/datatype.html
         */
        this.supportedDataTypes = [
            "int",
            "int2",
            "int4",
            "int8",
            "smallint",
            "integer",
            "bigint",
            "decimal",
            "numeric",
            "real",
            "float",
            "float4",
            "float8",
            "double precision",
            "money",
            "character varying",
            "varchar",
            "character",
            "char",
            "text",
            "citext",
            "hstore",
            "bytea",
            "bit",
            "varbit",
            "bit varying",
            "timetz",
            "timestamptz",
            "timestamptz3",
            "timestamp",
            "timestamp without time zone",
            "timestamp with time zone",
            "date",
            "time",
            "time without time zone",
            "time with time zone",
            "interval",
            "bool",
            "boolean",
            "enum",
            "point",
            "line",
            "lseg",
            "box",
            "path",
            "polygon",
            "circle",
            "cidr",
            "inet",
            "macaddr",
            "tsvector",
            "tsquery",
            "uuid",
            "xml",
            "json",
            "jsonb",
            "int4range",
            "int8range",
            "numrange",
            "tsrange",
            "tstzrange",
            "daterange",
            "geometry",
            "geography",
            "cube",
            "ltree"
        ];
        /**
         * Gets list of spatial column data types.
         */
        this.spatialTypes = [
            "geometry",
            "geography"
        ];
        /**
         * Gets list of column data types that support length by a driver.
         */
        this.withLengthColumnTypes = [
            "character varying",
            "varchar",
            "character",
            "char",
            "bit",
            "varbit",
            "bit varying"
        ];
        /**
         * Gets list of column data types that support precision by a driver.
         */
        this.withPrecisionColumnTypes = [
            "numeric",
            "decimal",
            "interval",
            "time without time zone",
            "time with time zone",
            "timestamp without time zone",
            "timestamp with time zone"
        ];
        /**
         * Gets list of column data types that support scale by a driver.
         */
        this.withScaleColumnTypes = [
            "numeric",
            "decimal"
        ];
        /**
         * Orm has special columns and we need to know what database column types should be for those types.
         * Column types are driver dependant.
         */
        this.mappedDataTypes = {
            createDate: "timestamp",
            createDateDefault: "now()",
            updateDate: "timestamp",
            updateDateDefault: "now()",
            deleteDate: "timestamp",
            deleteDateNullable: true,
            version: "int4",
            treeLevel: "int4",
            migrationId: "int4",
            migrationName: "varchar",
            migrationTimestamp: "int8",
            cacheId: "int4",
            cacheIdentifier: "varchar",
            cacheTime: "int8",
            cacheDuration: "int4",
            cacheQuery: "text",
            cacheResult: "text",
            metadataType: "varchar",
            metadataDatabase: "varchar",
            metadataSchema: "varchar",
            metadataTable: "varchar",
            metadataName: "varchar",
            metadataValue: "text",
        };
        /**
         * Default values of length, precision and scale depends on column data type.
         * Used in the cases when length/precision/scale is not specified by user.
         */
        this.dataTypeDefaults = {
            "character": { length: 1 },
            "bit": { length: 1 },
            "interval": { precision: 6 },
            "time without time zone": { precision: 6 },
            "time with time zone": { precision: 6 },
            "timestamp without time zone": { precision: 6 },
            "timestamp with time zone": { precision: 6 },
        };
        /**
         * Max length allowed by Postgres for aliases.
         * @see https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
         */
        this.maxAliasLength = 63;
        if (!connection) {
            return;
        }
        this.connection = connection;
        this.options = connection.options;
        this.isReplicated = this.options.replication ? true : false;
        if (this.options.useUTC) {
            process.env.PGTZ = 'UTC';
        }
        // load postgres package
        this.loadDependencies();
        // ObjectUtils.assign(this.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way
        // validate options to make sure everything is set
        // todo: revisit validation with replication in mind
        // if (!this.options.host)
        //     throw new DriverOptionNotSetError("host");
        // if (!this.options.username)
        //     throw new DriverOptionNotSetError("username");
        // if (!this.options.database)
        //     throw new DriverOptionNotSetError("database");
    }
    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------
    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    PostgresDriver.prototype.connect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            var _this = this;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!this.options.replication) return [3 /*break*/, 3];
                        _a = this;
                        return [4 /*yield*/, Promise.all(this.options.replication.slaves.map(function (slave) {
                                return _this.createPool(_this.options, slave);
                            }))];
                    case 1:
                        _a.slaves = _d.sent();
                        _b = this;
                        return [4 /*yield*/, this.createPool(this.options, this.options.replication.master)];
                    case 2:
                        _b.master = _d.sent();
                        this.database = this.options.replication.master.database;
                        return [3 /*break*/, 5];
                    case 3:
                        _c = this;
                        return [4 /*yield*/, this.createPool(this.options, this.options)];
                    case 4:
                        _c.master = _d.sent();
                        this.database = this.options.database;
                        _d.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    PostgresDriver.prototype.afterConnect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var extensionsMetadata;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkMetadataForExtensions()];
                    case 1:
                        extensionsMetadata = _a.sent();
                        if (!extensionsMetadata.hasExtensions) return [3 /*break*/, 3];
                        return [4 /*yield*/, Promise.all(tslib_1.__spreadArray([this.master], tslib_1.__read(this.slaves)).map(function (pool) {
                                return new Promise(function (ok, fail) {
                                    pool.connect(function (err, connection, release) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                        return tslib_1.__generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, this.enableExtensions(extensionsMetadata, connection)];
                                                case 1:
                                                    _a.sent();
                                                    if (err)
                                                        return [2 /*return*/, fail(err)];
                                                    release();
                                                    ok();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); });
                                });
                            }))];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, Promise.resolve()];
                }
            });
        });
    };
    PostgresDriver.prototype.enableExtensions = function (extensionsMetadata, connection) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var logger, hasUuidColumns, hasCitextColumns, hasHstoreColumns, hasCubeColumns, hasGeometryColumns, hasLtreeColumns, hasExclusionConstraints, _1, _2, _3, _4, _5, _6, _7;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger = this.connection.logger;
                        hasUuidColumns = extensionsMetadata.hasUuidColumns, hasCitextColumns = extensionsMetadata.hasCitextColumns, hasHstoreColumns = extensionsMetadata.hasHstoreColumns, hasCubeColumns = extensionsMetadata.hasCubeColumns, hasGeometryColumns = extensionsMetadata.hasGeometryColumns, hasLtreeColumns = extensionsMetadata.hasLtreeColumns, hasExclusionConstraints = extensionsMetadata.hasExclusionConstraints;
                        if (!hasUuidColumns) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.executeQuery(connection, "CREATE EXTENSION IF NOT EXISTS \"" + (this.options.uuidExtension || "uuid-ossp") + "\"")];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _1 = _a.sent();
                        logger.log("warn", "At least one of the entities has uuid column, but the '" + (this.options.uuidExtension || "uuid-ossp") + "' extension cannot be installed automatically. Please install it manually using superuser rights, or select another uuid extension.");
                        return [3 /*break*/, 4];
                    case 4:
                        if (!hasCitextColumns) return [3 /*break*/, 8];
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.executeQuery(connection, "CREATE EXTENSION IF NOT EXISTS \"citext\"")];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        _2 = _a.sent();
                        logger.log("warn", "At least one of the entities has citext column, but the 'citext' extension cannot be installed automatically. Please install it manually using superuser rights");
                        return [3 /*break*/, 8];
                    case 8:
                        if (!hasHstoreColumns) return [3 /*break*/, 12];
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, this.executeQuery(connection, "CREATE EXTENSION IF NOT EXISTS \"hstore\"")];
                    case 10:
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        _3 = _a.sent();
                        logger.log("warn", "At least one of the entities has hstore column, but the 'hstore' extension cannot be installed automatically. Please install it manually using superuser rights");
                        return [3 /*break*/, 12];
                    case 12:
                        if (!hasGeometryColumns) return [3 /*break*/, 16];
                        _a.label = 13;
                    case 13:
                        _a.trys.push([13, 15, , 16]);
                        return [4 /*yield*/, this.executeQuery(connection, "CREATE EXTENSION IF NOT EXISTS \"postgis\"")];
                    case 14:
                        _a.sent();
                        return [3 /*break*/, 16];
                    case 15:
                        _4 = _a.sent();
                        logger.log("warn", "At least one of the entities has a geometry column, but the 'postgis' extension cannot be installed automatically. Please install it manually using superuser rights");
                        return [3 /*break*/, 16];
                    case 16:
                        if (!hasCubeColumns) return [3 /*break*/, 20];
                        _a.label = 17;
                    case 17:
                        _a.trys.push([17, 19, , 20]);
                        return [4 /*yield*/, this.executeQuery(connection, "CREATE EXTENSION IF NOT EXISTS \"cube\"")];
                    case 18:
                        _a.sent();
                        return [3 /*break*/, 20];
                    case 19:
                        _5 = _a.sent();
                        logger.log("warn", "At least one of the entities has a cube column, but the 'cube' extension cannot be installed automatically. Please install it manually using superuser rights");
                        return [3 /*break*/, 20];
                    case 20:
                        if (!hasLtreeColumns) return [3 /*break*/, 24];
                        _a.label = 21;
                    case 21:
                        _a.trys.push([21, 23, , 24]);
                        return [4 /*yield*/, this.executeQuery(connection, "CREATE EXTENSION IF NOT EXISTS \"ltree\"")];
                    case 22:
                        _a.sent();
                        return [3 /*break*/, 24];
                    case 23:
                        _6 = _a.sent();
                        logger.log("warn", "At least one of the entities has a cube column, but the 'ltree' extension cannot be installed automatically. Please install it manually using superuser rights");
                        return [3 /*break*/, 24];
                    case 24:
                        if (!hasExclusionConstraints) return [3 /*break*/, 28];
                        _a.label = 25;
                    case 25:
                        _a.trys.push([25, 27, , 28]);
                        // The btree_gist extension provides operator support in PostgreSQL exclusion constraints
                        return [4 /*yield*/, this.executeQuery(connection, "CREATE EXTENSION IF NOT EXISTS \"btree_gist\"")];
                    case 26:
                        // The btree_gist extension provides operator support in PostgreSQL exclusion constraints
                        _a.sent();
                        return [3 /*break*/, 28];
                    case 27:
                        _7 = _a.sent();
                        logger.log("warn", "At least one of the entities has an exclusion constraint, but the 'btree_gist' extension cannot be installed automatically. Please install it manually using superuser rights");
                        return [3 /*break*/, 28];
                    case 28: return [2 /*return*/];
                }
            });
        });
    };
    PostgresDriver.prototype.checkMetadataForExtensions = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var hasUuidColumns, hasCitextColumns, hasHstoreColumns, hasCubeColumns, hasGeometryColumns, hasLtreeColumns, hasExclusionConstraints;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                hasUuidColumns = this.connection.entityMetadatas.some(function (metadata) {
                    return metadata.generatedColumns.filter(function (column) { return column.generationStrategy === "uuid"; }).length > 0;
                });
                hasCitextColumns = this.connection.entityMetadatas.some(function (metadata) {
                    return metadata.columns.filter(function (column) { return column.type === "citext"; }).length > 0;
                });
                hasHstoreColumns = this.connection.entityMetadatas.some(function (metadata) {
                    return metadata.columns.filter(function (column) { return column.type === "hstore"; }).length > 0;
                });
                hasCubeColumns = this.connection.entityMetadatas.some(function (metadata) {
                    return metadata.columns.filter(function (column) { return column.type === "cube"; }).length > 0;
                });
                hasGeometryColumns = this.connection.entityMetadatas.some(function (metadata) {
                    return metadata.columns.filter(function (column) { return _this.spatialTypes.indexOf(column.type) >= 0; }).length > 0;
                });
                hasLtreeColumns = this.connection.entityMetadatas.some(function (metadata) {
                    return metadata.columns.filter(function (column) { return column.type === "ltree"; }).length > 0;
                });
                hasExclusionConstraints = this.connection.entityMetadatas.some(function (metadata) {
                    return metadata.exclusions.length > 0;
                });
                return [2 /*return*/, {
                        hasUuidColumns: hasUuidColumns,
                        hasCitextColumns: hasCitextColumns,
                        hasHstoreColumns: hasHstoreColumns,
                        hasCubeColumns: hasCubeColumns,
                        hasGeometryColumns: hasGeometryColumns,
                        hasLtreeColumns: hasLtreeColumns,
                        hasExclusionConstraints: hasExclusionConstraints,
                        hasExtensions: hasUuidColumns || hasCitextColumns || hasHstoreColumns || hasGeometryColumns || hasCubeColumns || hasLtreeColumns || hasExclusionConstraints,
                    }];
            });
        });
    };
    /**
     * Closes connection with database.
     */
    PostgresDriver.prototype.disconnect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.master)
                            return [2 /*return*/, Promise.reject(new ConnectionIsNotSetError_1.ConnectionIsNotSetError("postgres"))];
                        return [4 /*yield*/, this.closePool(this.master)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, Promise.all(this.slaves.map(function (slave) { return _this.closePool(slave); }))];
                    case 2:
                        _a.sent();
                        this.master = undefined;
                        this.slaves = [];
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a schema builder used to build and sync a schema.
     */
    PostgresDriver.prototype.createSchemaBuilder = function () {
        return new RdbmsSchemaBuilder_1.RdbmsSchemaBuilder(this.connection);
    };
    /**
     * Creates a query runner used to execute database queries.
     */
    PostgresDriver.prototype.createQueryRunner = function (mode) {
        return new PostgresQueryRunner_1.PostgresQueryRunner(this, mode);
    };
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    PostgresDriver.prototype.preparePersistentValue = function (value, columnMetadata) {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers_1.ApplyValueTransformers.transformTo(columnMetadata.transformer, value);
        if (value === null || value === undefined)
            return value;
        if (columnMetadata.type === Boolean) {
            return value === true ? 1 : 0;
        }
        else if (columnMetadata.type === "date") {
            return DateUtils_1.DateUtils.mixedDateToDateString(value);
        }
        else if (columnMetadata.type === "time") {
            return DateUtils_1.DateUtils.mixedDateToTimeString(value);
        }
        else if (columnMetadata.type === "datetime"
            || columnMetadata.type === Date
            || columnMetadata.type === "timestamp"
            || columnMetadata.type === "timestamp with time zone"
            || columnMetadata.type === "timestamp without time zone") {
            /* For some reason tiemstamptz isn't in this list, seems it should have been mapped
            down below, so our timestamptz's don't use this. THAT IS A GOOD THING, we don't
            need TypeORM mucking with our timestamps. CWIKLA
            */
            return DateUtils_1.DateUtils.mixedDateToDate(value);
        }
        else if (tslib_1.__spreadArray(["json", "jsonb"], tslib_1.__read(this.spatialTypes)).indexOf(columnMetadata.type) >= 0) {
            return JSON.stringify(value);
        }
        else if (columnMetadata.type === "hstore") {
            if (typeof value === "string") {
                return value;
            }
            else {
                // https://www.postgresql.org/docs/9.0/hstore.html
                var quoteString_1 = function (value) {
                    // If a string to be quoted is `null` or `undefined`, we return a literal unquoted NULL.
                    // This way, NULL values can be stored in the hstore object.
                    if (value === null || typeof value === "undefined") {
                        return "NULL";
                    }
                    // Convert non-null values to string since HStore only stores strings anyway.
                    // To include a double quote or a backslash in a key or value, escape it with a backslash.
                    return "\"" + ("" + value).replace(/(?=["\\])/g, "\\") + "\"";
                };
                return Object.keys(value).map(function (key) { return quoteString_1(key) + "=>" + quoteString_1(value[key]); }).join(",");
            }
        }
        else if (columnMetadata.type === "simple-array") {
            return DateUtils_1.DateUtils.simpleArrayToString(value);
        }
        else if (columnMetadata.type === "simple-json") {
            return DateUtils_1.DateUtils.simpleJsonToString(value);
        }
        else if (columnMetadata.type === "cube") {
            if (columnMetadata.isArray) {
                return "{" + value.map(function (cube) { return "\"(" + cube.join(",") + ")\""; }).join(",") + "}";
            }
            return "(" + value.join(",") + ")";
        }
        else if (columnMetadata.type === "ltree") {
            return value.split(".").filter(Boolean).join(".").replace(/[\s]+/g, "_");
        }
        else if ((columnMetadata.type === "enum"
            || columnMetadata.type === "simple-enum")
            && !columnMetadata.isArray) {
            return "" + value;
        }
        return value;
    };
    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    PostgresDriver.prototype.prepareHydratedValue = function (value, columnMetadata) {
        if (value === null || value === undefined)
            return columnMetadata.transformer ? ApplyValueTransformers_1.ApplyValueTransformers.transformFrom(columnMetadata.transformer, value) : value;
        if (columnMetadata.type === Boolean) {
            value = value ? true : false;
        }
        else if (columnMetadata.type === "datetime"
            || columnMetadata.type === Date
            || columnMetadata.type === "timestamp"
            || columnMetadata.type === "timestamp with time zone"
            || columnMetadata.type === "timestamp without time zone") {
            value = DateUtils_1.DateUtils.normalizeHydratedDate(value);
        }
        else if (columnMetadata.type === "date") {
            value = DateUtils_1.DateUtils.mixedDateToDateString(value);
        }
        else if (columnMetadata.type === "time") {
            value = DateUtils_1.DateUtils.mixedTimeToString(value);
        }
        else if (columnMetadata.type === "hstore") {
            if (columnMetadata.hstoreType === "object") {
                var unescapeString_1 = function (str) { return str.replace(/\\./g, function (m) { return m[1]; }); };
                var regexp = /"([^"\\]*(?:\\.[^"\\]*)*)"=>(?:(NULL)|"([^"\\]*(?:\\.[^"\\]*)*)")(?:,|$)/g;
                var object_1 = {};
                ("" + value).replace(regexp, function (_, key, nullValue, stringValue) {
                    object_1[unescapeString_1(key)] = nullValue ? null : unescapeString_1(stringValue);
                    return "";
                });
                return object_1;
            }
            else {
                return value;
            }
        }
        else if (columnMetadata.type === "simple-array") {
            value = DateUtils_1.DateUtils.stringToSimpleArray(value);
        }
        else if (columnMetadata.type === "simple-json") {
            value = DateUtils_1.DateUtils.stringToSimpleJson(value);
        }
        else if (columnMetadata.type === "cube") {
            value = value.replace(/[\(\)\s]+/g, ""); // remove whitespace
            if (columnMetadata.isArray) {
                /**
                 * Strips these groups from `{"1,2,3","",NULL}`:
                 * 1. ["1,2,3", undefined]  <- cube of arity 3
                 * 2. ["", undefined]         <- cube of arity 0
                 * 3. [undefined, "NULL"]     <- NULL
                 */
                var regexp = /(?:\"((?:[\d\s\.,])*)\")|(?:(NULL))/g;
                var unparsedArrayString = value;
                value = [];
                var cube = null;
                // Iterate through all regexp matches for cubes/null in array
                while ((cube = regexp.exec(unparsedArrayString)) !== null) {
                    if (cube[1] !== undefined) {
                        value.push(cube[1].split(",").filter(Boolean).map(Number));
                    }
                    else {
                        value.push(undefined);
                    }
                }
            }
            else {
                value = value.split(",").filter(Boolean).map(Number);
            }
        }
        else if (columnMetadata.type === "enum" || columnMetadata.type === "simple-enum") {
            if (columnMetadata.isArray) {
                if (value === "{}")
                    return [];
                // manually convert enum array to array of values (pg does not support, see https://github.com/brianc/node-pg-types/issues/56)
                value = value.substr(1, value.length - 2).split(",").map(function (val) {
                    // replace double quotes from the beginning and from the end
                    if (val.startsWith("\"") && val.endsWith("\""))
                        val = val.slice(1, -1);
                    // replace double escaped backslash to single escaped e.g. \\\\ -> \\
                    val = val.replace(/(\\\\)/g, "\\");
                    // replace escaped double quotes to non-escaped e.g. \"asd\" -> "asd"
                    return val.replace(/(\\")/g, '"');
                });
                // convert to number if that exists in possible enum options
                value = value.map(function (val) {
                    return !isNaN(+val) && columnMetadata.enum.indexOf(parseInt(val)) >= 0 ? parseInt(val) : val;
                });
            }
            else {
                // convert to number if that exists in possible enum options
                value = !isNaN(+value) && columnMetadata.enum.indexOf(parseInt(value)) >= 0 ? parseInt(value) : value;
            }
        }
        if (columnMetadata.transformer)
            value = ApplyValueTransformers_1.ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);
        return value;
    };
    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    PostgresDriver.prototype.escapeQueryWithParameters = function (sql, parameters, nativeParameters) {
        var builtParameters = Object.keys(nativeParameters).map(function (key) { return nativeParameters[key]; });
        if (!parameters || !Object.keys(parameters).length)
            return [sql, builtParameters];
        var keys = Object.keys(parameters).map(function (parameter) { return "(:(\\.\\.\\.)?" + parameter + "\\b)"; }).join("|");
        sql = sql.replace(new RegExp(keys, "g"), function (key) {
            var value;
            var isArray = false;
            if (key.substr(0, 4) === ":...") {
                isArray = true;
                value = parameters[key.substr(4)];
            }
            else {
                value = parameters[key.substr(1)];
            }
            if (isArray) {
                return value.map(function (v) {
                    builtParameters.push(v);
                    return "$" + builtParameters.length;
                }).join(", ");
            }
            else if (value instanceof Function) {
                return value();
            }
            else {
                builtParameters.push(value);
                return "$" + builtParameters.length;
            }
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, builtParameters];
    };
    /**
     * Escapes a column name.
     */
    PostgresDriver.prototype.escape = function (columnName) {
        return "\"" + columnName + "\"";
    };
    /**
     * Build full table name with schema name and table name.
     * E.g. "mySchema"."myTable"
     */
    PostgresDriver.prototype.buildTableName = function (tableName, schema) {
        return schema ? schema + "." + tableName : tableName;
    };
    /**
     * Creates a database type from a given column metadata.
     */
    PostgresDriver.prototype.normalizeType = function (column) {
        if (column.type === Number || column.type === "int" || column.type === "int4") {
            return "integer";
        }
        else if (column.type === String || column.type === "varchar") {
            return "character varying";
        }
        else if (column.type === Date || column.type === "timestamp") {
            return "timestamp without time zone";
        }
        else if (column.type === "timestamptz") {
            return "timestamp with time zone";
        }
        else if (column.type === "time") {
            return "time without time zone";
        }
        else if (column.type === "timetz") {
            return "time with time zone";
        }
        else if (column.type === Boolean || column.type === "bool") {
            return "boolean";
        }
        else if (column.type === "simple-array") {
            return "text";
        }
        else if (column.type === "simple-json") {
            return "text";
        }
        else if (column.type === "simple-enum") {
            return "enum";
        }
        else if (column.type === "int2") {
            return "smallint";
        }
        else if (column.type === "int8") {
            return "bigint";
        }
        else if (column.type === "decimal") {
            return "numeric";
        }
        else if (column.type === "float8" || column.type === "float") {
            return "double precision";
        }
        else if (column.type === "float4") {
            return "real";
        }
        else if (column.type === "char") {
            return "character";
        }
        else if (column.type === "varbit") {
            return "bit varying";
        }
        else {
            return column.type || "";
        }
    };
    /**
     * Normalizes "default" value of the column.
     */
    PostgresDriver.prototype.normalizeDefault = function (columnMetadata) {
        var defaultValue = columnMetadata.default;
        if (defaultValue === null) {
            return undefined;
        }
        else if (columnMetadata.isArray && Array.isArray(defaultValue)) {
            return "'{" + defaultValue.map(function (val) { return "" + val; }).join(",") + "}'";
        }
        else if ((columnMetadata.type === "enum"
            || columnMetadata.type === "simple-enum"
            || typeof defaultValue === "number"
            || typeof defaultValue === "string")
            && defaultValue !== undefined) {
            return "'" + defaultValue + "'";
        }
        else if (typeof defaultValue === "boolean") {
            return defaultValue === true ? "true" : "false";
        }
        else if (typeof defaultValue === "function") {
            return defaultValue();
        }
        else if (typeof defaultValue === "object") {
            return "'" + JSON.stringify(defaultValue) + "'";
        }
        else {
            return defaultValue;
        }
    };
    /**
     * Normalizes "isUnique" value of the column.
     */
    PostgresDriver.prototype.normalizeIsUnique = function (column) {
        return column.entityMetadata.uniques.some(function (uq) { return uq.columns.length === 1 && uq.columns[0] === column; });
    };
    /**
     * Returns default column lengths, which is required on column creation.
     */
    PostgresDriver.prototype.getColumnLength = function (column) {
        return column.length ? column.length.toString() : "";
    };
    /**
     * Creates column type definition including length, precision and scale
     */
    PostgresDriver.prototype.createFullType = function (column) {
        var type = column.type;
        if (column.length) {
            type += "(" + column.length + ")";
        }
        else if (column.precision !== null && column.precision !== undefined && column.scale !== null && column.scale !== undefined) {
            type += "(" + column.precision + "," + column.scale + ")";
        }
        else if (column.precision !== null && column.precision !== undefined) {
            type += "(" + column.precision + ")";
        }
        if (column.type === "time without time zone") {
            type = "TIME" + (column.precision !== null && column.precision !== undefined ? "(" + column.precision + ")" : "");
        }
        else if (column.type === "time with time zone") {
            type = "TIME" + (column.precision !== null && column.precision !== undefined ? "(" + column.precision + ")" : "") + " WITH TIME ZONE";
        }
        else if (column.type === "timestamp without time zone") {
            type = "TIMESTAMP" + (column.precision !== null && column.precision !== undefined ? "(" + column.precision + ")" : "");
        }
        else if (column.type === "timestamp with time zone") {
            type = "TIMESTAMP" + (column.precision !== null && column.precision !== undefined ? "(" + column.precision + ")" : "") + " WITH TIME ZONE";
        }
        else if (this.spatialTypes.indexOf(column.type) >= 0) {
            if (column.spatialFeatureType != null && column.srid != null) {
                type = column.type + "(" + column.spatialFeatureType + "," + column.srid + ")";
            }
            else if (column.spatialFeatureType != null) {
                type = column.type + "(" + column.spatialFeatureType + ")";
            }
            else {
                type = column.type;
            }
        }
        if (column.isArray)
            type += " array";
        return type;
    };
    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    PostgresDriver.prototype.obtainMasterConnection = function () {
        var _this = this;
        return new Promise(function (ok, fail) {
            _this.master.connect(function (err, connection, release) {
                err ? fail(err) : ok([connection, release]);
            });
        });
    };
    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    PostgresDriver.prototype.obtainSlaveConnection = function () {
        var _this = this;
        if (!this.slaves.length)
            return this.obtainMasterConnection();
        return new Promise(function (ok, fail) {
            var random = Math.floor(Math.random() * _this.slaves.length);
            _this.slaves[random].connect(function (err, connection, release) {
                err ? fail(err) : ok([connection, release]);
            });
        });
    };
    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     *
     * todo: slow. optimize Object.keys(), OrmUtils.mergeDeep and column.createValueMap parts
     */
    PostgresDriver.prototype.createGeneratedMap = function (metadata, insertResult) {
        if (!insertResult)
            return undefined;
        return Object.keys(insertResult).reduce(function (map, key) {
            var column = metadata.findColumnWithDatabaseName(key);
            if (column) {
                OrmUtils_1.OrmUtils.mergeDeep(map, column.createValueMap(insertResult[key]));
                // OrmUtils.mergeDeep(map, column.createValueMap(this.prepareHydratedValue(insertResult[key], column))); // TODO: probably should be like there, but fails on enums, fix later
            }
            return map;
        }, {});
    };
    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    PostgresDriver.prototype.findChangedColumns = function (tableColumns, columnMetadatas) {
        var _this = this;
        return columnMetadatas.filter(function (columnMetadata) {
            var tableColumn = tableColumns.find(function (c) { return c.name === columnMetadata.databaseName; });
            if (!tableColumn)
                return false; // we don't need new columns, we only need exist and changed
            var isColumnChanged = tableColumn.name !== columnMetadata.databaseName
                || tableColumn.type !== _this.normalizeType(columnMetadata)
                || tableColumn.length !== columnMetadata.length
                || tableColumn.isArray !== columnMetadata.isArray
                || tableColumn.precision !== columnMetadata.precision
                || (columnMetadata.scale !== undefined && tableColumn.scale !== columnMetadata.scale)
                || tableColumn.comment !== columnMetadata.comment
                || (!tableColumn.isGenerated && _this.lowerDefaultValueIfNecessary(_this.normalizeDefault(columnMetadata)) !== tableColumn.default) // we included check for generated here, because generated columns already can have default values
                || tableColumn.isPrimary !== columnMetadata.isPrimary
                || tableColumn.isNullable !== columnMetadata.isNullable
                || tableColumn.isUnique !== _this.normalizeIsUnique(columnMetadata)
                || tableColumn.enumName !== columnMetadata.enumName
                || (tableColumn.enum && columnMetadata.enum && !OrmUtils_1.OrmUtils.isArraysEqual(tableColumn.enum, columnMetadata.enum.map(function (val) { return val + ""; }))) // enums in postgres are always strings
                || tableColumn.isGenerated !== columnMetadata.isGenerated
                || (tableColumn.spatialFeatureType || "").toLowerCase() !== (columnMetadata.spatialFeatureType || "").toLowerCase()
                || tableColumn.srid !== columnMetadata.srid;
            // DEBUG SECTION
            // if (isColumnChanged) {
            //     console.log("table:", columnMetadata.entityMetadata.tableName);
            //     console.log("name:", tableColumn.name, columnMetadata.databaseName);
            //     console.log("type:", tableColumn.type, this.normalizeType(columnMetadata));
            //     console.log("length:", tableColumn.length, columnMetadata.length);
            //     console.log("isArray:", tableColumn.isArray, columnMetadata.isArray);
            //     console.log("precision:", tableColumn.precision, columnMetadata.precision);
            //     console.log("scale:", tableColumn.scale, columnMetadata.scale);
            //     console.log("comment:", tableColumn.comment, columnMetadata.comment);
            //     console.log("enumName:", tableColumn.enumName, columnMetadata.enumName);
            //     console.log("enum:", tableColumn.enum && columnMetadata.enum && !OrmUtils.isArraysEqual(tableColumn.enum, columnMetadata.enum.map(val => val + "")));
            //     console.log("onUpdate:", tableColumn.onUpdate, columnMetadata.onUpdate);
            //     console.log("isPrimary:", tableColumn.isPrimary, columnMetadata.isPrimary);
            //     console.log("isNullable:", tableColumn.isNullable, columnMetadata.isNullable);
            //     console.log("isUnique:", tableColumn.isUnique, this.normalizeIsUnique(columnMetadata));
            //     console.log("isGenerated:", tableColumn.isGenerated, columnMetadata.isGenerated);
            //     console.log("isGenerated 2:", !tableColumn.isGenerated && this.lowerDefaultValueIfNecessary(this.normalizeDefault(columnMetadata)) !== tableColumn.default);
            //     console.log("spatialFeatureType:", (tableColumn.spatialFeatureType || "").toLowerCase(), (columnMetadata.spatialFeatureType || "").toLowerCase());
            //     console.log("srid", tableColumn.srid, columnMetadata.srid);
            //     console.log("==========================================");
            // }
            return isColumnChanged;
        });
    };
    PostgresDriver.prototype.lowerDefaultValueIfNecessary = function (value) {
        // Postgres saves function calls in default value as lowercase #2733
        if (!value) {
            return value;
        }
        return value.split("'").map(function (v, i) {
            return i % 2 === 1 ? v : v.toLowerCase();
        }).join("'");
    };
    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    PostgresDriver.prototype.isReturningSqlSupported = function () {
        return true;
    };
    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    PostgresDriver.prototype.isUUIDGenerationSupported = function () {
        return true;
    };
    /**
     * Returns true if driver supports fulltext indices.
     */
    PostgresDriver.prototype.isFullTextColumnTypeSupported = function () {
        return false;
    };
    Object.defineProperty(PostgresDriver.prototype, "uuidGenerator", {
        get: function () {
            return this.options.uuidExtension === "pgcrypto" ? "gen_random_uuid()" : "uuid_generate_v4()";
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Creates an escaped parameter.
     */
    PostgresDriver.prototype.createParameter = function (parameterName, index) {
        return "$" + (index + 1);
    };
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Loads postgres query stream package.
     */
    PostgresDriver.prototype.loadStreamDependency = function () {
        try {
            return PlatformTools_1.PlatformTools.load("pg-query-stream");
        }
        catch (e) { // todo: better error for browser env
            throw new Error("To use streams you should install pg-query-stream package. Please run npm i pg-query-stream --save command.");
        }
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    PostgresDriver.prototype.loadDependencies = function () {
        try {
            this.postgres = PlatformTools_1.PlatformTools.load("pg");
            try {
                var pgNative = PlatformTools_1.PlatformTools.load("pg-native");
                if (pgNative && this.postgres.native)
                    this.postgres = this.postgres.native;
            }
            catch (e) { }
        }
        catch (e) { // todo: better error for browser env
            throw new DriverPackageNotInstalledError_1.DriverPackageNotInstalledError("Postgres", "pg");
        }
    };
    /**
     * Creates a new connection pool for a given database credentials.
     */
    PostgresDriver.prototype.createPool = function (options, credentials) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var connectionOptions, pool, logger, poolErrorHandler;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                credentials = Object.assign({}, credentials);
                connectionOptions = Object.assign({}, {
                    connectionString: credentials.url,
                    host: credentials.host,
                    user: credentials.username,
                    password: credentials.password,
                    database: credentials.database,
                    port: credentials.port,
                    ssl: credentials.ssl,
                    connectionTimeoutMillis: options.connectTimeoutMS
                }, options.extra || {});
                pool = new this.postgres.Pool(connectionOptions);
                logger = this.connection.logger;
                poolErrorHandler = options.poolErrorHandler || (function (error) { return logger.log("warn", "Postgres pool raised an error. " + error); });
                /*
                  Attaching an error handler to pool errors is essential, as, otherwise, errors raised will go unhandled and
                  cause the hosting app to crash.
                 */
                pool.on("error", poolErrorHandler);
                return [2 /*return*/, new Promise(function (ok, fail) {
                        pool.connect(function (err, connection, release) {
                            if (err)
                                return fail(err);
                            if (options.logNotifications) {
                                connection.on("notice", function (msg) {
                                    msg && _this.connection.logger.log("info", msg.message);
                                });
                                connection.on("notification", function (msg) {
                                    msg && _this.connection.logger.log("info", "Received NOTIFY on channel " + msg.channel + ": " + msg.payload + ".");
                                });
                            }
                            release();
                            ok(pool);
                        });
                    })];
            });
        });
    };
    /**
     * Closes connection pool.
     */
    PostgresDriver.prototype.closePool = function (pool) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(this.connectedQueryRunners.map(function (queryRunner) { return queryRunner.release(); }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, new Promise(function (ok, fail) {
                                pool.end(function (err) { return err ? fail(err) : ok(); });
                            })];
                }
            });
        });
    };
    /**
     * Executes given query.
     */
    PostgresDriver.prototype.executeQuery = function (connection, query) {
        return new Promise(function (ok, fail) {
            connection.query(query, function (err, result) {
                if (err)
                    return fail(err);
                ok(result);
            });
        });
    };
    return PostgresDriver;
}());
exports.PostgresDriver = PostgresDriver;

//# sourceMappingURL=PostgresDriver.js.map
