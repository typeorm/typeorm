"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoQueryRunner = void 0;
var tslib_1 = require("tslib");
var Broadcaster_1 = require("../../subscriber/Broadcaster");
/**
 * Runs queries on a single MongoDB connection.
 */
var MongoQueryRunner = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function MongoQueryRunner(connection, databaseConnection) {
        /**
         * Indicates if connection for this query runner is released.
         * Once its released, query runner cannot run queries anymore.
         * Always false for mongodb since mongodb has a single query executor instance.
         */
        this.isReleased = false;
        /**
         * Indicates if transaction is active in this query executor.
         * Always false for mongodb since mongodb does not support transactions.
         */
        this.isTransactionActive = false;
        /**
         * Stores temporarily user data.
         * Useful for sharing data with subscribers.
         */
        this.data = {};
        this.connection = connection;
        this.databaseConnection = databaseConnection;
        this.broadcaster = new Broadcaster_1.Broadcaster(this);
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    MongoQueryRunner.prototype.cursor = function (collectionName, query) {
        return this.getCollection(collectionName).find(query || {});
    };
    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    MongoQueryRunner.prototype.aggregate = function (collectionName, pipeline, options) {
        return this.getCollection(collectionName).aggregate(pipeline, options);
    };
    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    MongoQueryRunner.prototype.bulkWrite = function (collectionName, operations, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).bulkWrite(operations, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Count number of matching documents in the db to a query.
     */
    MongoQueryRunner.prototype.count = function (collectionName, query, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).countDocuments(query || {}, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Creates an index on the db and collection.
     */
    MongoQueryRunner.prototype.createCollectionIndex = function (collectionName, fieldOrSpec, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).createIndex(fieldOrSpec, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error. Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    MongoQueryRunner.prototype.createCollectionIndexes = function (collectionName, indexSpecs) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).createIndexes(indexSpecs)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Delete multiple documents on MongoDB.
     */
    MongoQueryRunner.prototype.deleteMany = function (collectionName, query, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).deleteMany(query, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Delete a document on MongoDB.
     */
    MongoQueryRunner.prototype.deleteOne = function (collectionName, query, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).deleteOne(query, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    MongoQueryRunner.prototype.distinct = function (collectionName, key, query, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).distinct(key, query, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Drops an index from this collection.
     */
    MongoQueryRunner.prototype.dropCollectionIndex = function (collectionName, indexName, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).dropIndex(indexName, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Drops all indexes from the collection.
     */
    MongoQueryRunner.prototype.dropCollectionIndexes = function (collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).dropIndexes()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    MongoQueryRunner.prototype.findOneAndDelete = function (collectionName, query, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).findOneAndDelete(query, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    MongoQueryRunner.prototype.findOneAndReplace = function (collectionName, query, replacement, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).findOneAndReplace(query, replacement, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    MongoQueryRunner.prototype.findOneAndUpdate = function (collectionName, query, update, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).findOneAndUpdate(query, update, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    MongoQueryRunner.prototype.geoHaystackSearch = function (collectionName, x, y, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).geoHaystackSearch(x, y, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Execute the geoNear command to search for items in the collection.
     */
    MongoQueryRunner.prototype.geoNear = function (collectionName, x, y, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).geoNear(x, y, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Run a group command across a collection.
     */
    MongoQueryRunner.prototype.group = function (collectionName, keys, condition, initial, reduce, finalize, command, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).group(keys, condition, initial, reduce, finalize, command, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Retrieve all the indexes on the collection.
     */
    MongoQueryRunner.prototype.collectionIndexes = function (collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).indexes()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Retrieve all the indexes on the collection.
     */
    MongoQueryRunner.prototype.collectionIndexExists = function (collectionName, indexes) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).indexExists(indexes)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Retrieves this collections index info.
     */
    MongoQueryRunner.prototype.collectionIndexInformation = function (collectionName, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).indexInformation(options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    MongoQueryRunner.prototype.initializeOrderedBulkOp = function (collectionName, options) {
        return this.getCollection(collectionName).initializeOrderedBulkOp(options);
    };
    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    MongoQueryRunner.prototype.initializeUnorderedBulkOp = function (collectionName, options) {
        return this.getCollection(collectionName).initializeUnorderedBulkOp(options);
    };
    /**
     * Inserts an array of documents into MongoDB.
     */
    MongoQueryRunner.prototype.insertMany = function (collectionName, docs, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).insertMany(docs, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Inserts a single document into MongoDB.
     */
    MongoQueryRunner.prototype.insertOne = function (collectionName, doc, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).insertOne(doc, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns if the collection is a capped collection.
     */
    MongoQueryRunner.prototype.isCapped = function (collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).isCapped()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Get the list of all indexes information for the collection.
     */
    MongoQueryRunner.prototype.listCollectionIndexes = function (collectionName, options) {
        return this.getCollection(collectionName).listIndexes(options);
    };
    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    MongoQueryRunner.prototype.mapReduce = function (collectionName, map, reduce, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).mapReduce(map, reduce, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    MongoQueryRunner.prototype.parallelCollectionScan = function (collectionName, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).parallelCollectionScan(options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    MongoQueryRunner.prototype.reIndex = function (collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).reIndex()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    MongoQueryRunner.prototype.rename = function (collectionName, newName, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).rename(newName, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Replace a document on MongoDB.
     */
    MongoQueryRunner.prototype.replaceOne = function (collectionName, query, doc, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).replaceOne(query, doc, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Get all the collection statistics.
     */
    MongoQueryRunner.prototype.stats = function (collectionName, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).stats(options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Watching new changes as stream.
     */
    MongoQueryRunner.prototype.watch = function (collectionName, pipeline, options) {
        return this.getCollection(collectionName).watch(pipeline, options);
    };
    /**
     * Update multiple documents on MongoDB.
     */
    MongoQueryRunner.prototype.updateMany = function (collectionName, query, update, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).updateMany(query, update, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Update a single document on MongoDB.
     */
    MongoQueryRunner.prototype.updateOne = function (collectionName, query, update, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCollection(collectionName).updateOne(query, update, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Public Implemented Methods (from QueryRunner)
    // -------------------------------------------------------------------------
    /**
     * Removes all collections from the currently connected database.
     * Be careful with using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    MongoQueryRunner.prototype.clearDatabase = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.databaseConnection.db(this.connection.driver.database).dropDatabase()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * For MongoDB database we don't create connection, because its single connection already created by a driver.
     */
    MongoQueryRunner.prototype.connect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * For MongoDB database we don't release connection, because its single connection.
     */
    MongoQueryRunner.prototype.release = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Starts transaction.
     */
    MongoQueryRunner.prototype.startTransaction = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Commits transaction.
     */
    MongoQueryRunner.prototype.commitTransaction = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Rollbacks transaction.
     */
    MongoQueryRunner.prototype.rollbackTransaction = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Executes a given SQL query.
     */
    MongoQueryRunner.prototype.query = function (query, parameters) {
        throw new Error("Executing SQL query is not supported by MongoDB driver.");
    };
    /**
     * Returns raw data stream.
     */
    MongoQueryRunner.prototype.stream = function (query, parameters, onEnd, onError) {
        throw new Error("Stream is not supported by MongoDB driver. Use watch instead.");
    };
    /**
     * Insert a new row with given values into the given table.
     * Returns value of inserted object id.

    async insert(collectionName: string, keyValues: ObjectLiteral): Promise<any> { // todo: fix any
        const results = await this.databaseConnection
            .collection(collectionName)
            .insertOne(keyValues);
        const generatedMap = this.connection.getMetadata(collectionName).objectIdColumn!.createValueMap(results.insertedId);
        return {
            result: results,
            generatedMap: generatedMap
        };
    }*/
    /**
     * Updates rows that match given conditions in the given table.

    async update(collectionName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<any> { // todo: fix any
        await this.databaseConnection
            .collection(collectionName)
            .updateOne(conditions, valuesMap);
    }*/
    /**
     * Deletes from the given table by a given conditions.

    async delete(collectionName: string, conditions: ObjectLiteral|ObjectLiteral[]|string, maybeParameters?: any[]): Promise<any> { // todo: fix any
        if (typeof conditions === "string")
            throw new Error(`String condition is not supported by MongoDB driver.`);

        await this.databaseConnection
            .collection(collectionName)
            .deleteOne(conditions);
    }*/
    /**
     * Returns all available database names including system databases.
     */
    MongoQueryRunner.prototype.getDatabases = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    MongoQueryRunner.prototype.getSchemas = function (database) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Loads given table's data from the database.
     */
    MongoQueryRunner.prototype.getTable = function (collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    MongoQueryRunner.prototype.getTables = function (collectionNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Loads given views's data from the database.
     */
    MongoQueryRunner.prototype.getView = function (collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Loads all views (with given names) from the database and creates a Table from them.
     */
    MongoQueryRunner.prototype.getViews = function (collectionNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Checks if database with the given name exist.
     */
    MongoQueryRunner.prototype.hasDatabase = function (database) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Check database queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Checks if schema with the given name exist.
     */
    MongoQueryRunner.prototype.hasSchema = function (schema) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Check schema queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Checks if table with the given name exist in the database.
     */
    MongoQueryRunner.prototype.hasTable = function (collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Check schema queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Checks if column with the given name exist in the given table.
     */
    MongoQueryRunner.prototype.hasColumn = function (tableOrName, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a database if it's not created.
     */
    MongoQueryRunner.prototype.createDatabase = function (database) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Database create queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops database.
     */
    MongoQueryRunner.prototype.dropDatabase = function (database, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Database drop queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new table schema.
     */
    MongoQueryRunner.prototype.createSchema = function (schema, ifNotExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema create queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops table schema.
     */
    MongoQueryRunner.prototype.dropSchema = function (schemaPath, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema drop queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new table from the given table and columns inside it.
     */
    MongoQueryRunner.prototype.createTable = function (table) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops the table.
     */
    MongoQueryRunner.prototype.dropTable = function (tableName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new view.
     */
    MongoQueryRunner.prototype.createView = function (view) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops the view.
     */
    MongoQueryRunner.prototype.dropView = function (target) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Renames the given table.
     */
    MongoQueryRunner.prototype.renameTable = function (oldTableOrName, newTableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new column from the column in the table.
     */
    MongoQueryRunner.prototype.addColumn = function (tableOrName, column) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new columns from the column in the table.
     */
    MongoQueryRunner.prototype.addColumns = function (tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Renames column in the given table.
     */
    MongoQueryRunner.prototype.renameColumn = function (tableOrName, oldTableColumnOrName, newTableColumnOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Changes a column in the table.
     */
    MongoQueryRunner.prototype.changeColumn = function (tableOrName, oldTableColumnOrName, newColumn) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Changes a column in the table.
     */
    MongoQueryRunner.prototype.changeColumns = function (tableOrName, changedColumns) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops column in the table.
     */
    MongoQueryRunner.prototype.dropColumn = function (tableOrName, columnOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops the columns in the table.
     */
    MongoQueryRunner.prototype.dropColumns = function (tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new primary key.
     */
    MongoQueryRunner.prototype.createPrimaryKey = function (tableOrName, columnNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Updates composite primary keys.
     */
    MongoQueryRunner.prototype.updatePrimaryKeys = function (tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops a primary key.
     */
    MongoQueryRunner.prototype.dropPrimaryKey = function (tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new unique constraint.
     */
    MongoQueryRunner.prototype.createUniqueConstraint = function (tableOrName, uniqueConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new unique constraints.
     */
    MongoQueryRunner.prototype.createUniqueConstraints = function (tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops an unique constraint.
     */
    MongoQueryRunner.prototype.dropUniqueConstraint = function (tableOrName, uniqueOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops an unique constraints.
     */
    MongoQueryRunner.prototype.dropUniqueConstraints = function (tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new check constraint.
     */
    MongoQueryRunner.prototype.createCheckConstraint = function (tableOrName, checkConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new check constraints.
     */
    MongoQueryRunner.prototype.createCheckConstraints = function (tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops check constraint.
     */
    MongoQueryRunner.prototype.dropCheckConstraint = function (tableOrName, checkOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops check constraints.
     */
    MongoQueryRunner.prototype.dropCheckConstraints = function (tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new exclusion constraint.
     */
    MongoQueryRunner.prototype.createExclusionConstraint = function (tableOrName, exclusionConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new exclusion constraints.
     */
    MongoQueryRunner.prototype.createExclusionConstraints = function (tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops exclusion constraint.
     */
    MongoQueryRunner.prototype.dropExclusionConstraint = function (tableOrName, exclusionOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops exclusion constraints.
     */
    MongoQueryRunner.prototype.dropExclusionConstraints = function (tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new foreign key.
     */
    MongoQueryRunner.prototype.createForeignKey = function (tableOrName, foreignKey) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new foreign keys.
     */
    MongoQueryRunner.prototype.createForeignKeys = function (tableOrName, foreignKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops a foreign key from the table.
     */
    MongoQueryRunner.prototype.dropForeignKey = function (tableOrName, foreignKey) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops a foreign keys from the table.
     */
    MongoQueryRunner.prototype.dropForeignKeys = function (tableOrName, foreignKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new index.
     */
    MongoQueryRunner.prototype.createIndex = function (tableOrName, index) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Creates a new indices
     */
    MongoQueryRunner.prototype.createIndices = function (tableOrName, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops an index from the table.
     */
    MongoQueryRunner.prototype.dropIndex = function (collectionName, indexName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops an indices from the table.
     */
    MongoQueryRunner.prototype.dropIndices = function (tableOrName, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema update queries are not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Drops collection.
     */
    MongoQueryRunner.prototype.clearTable = function (collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.databaseConnection
                            .db(this.connection.driver.database)
                            .dropCollection(collectionName)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    MongoQueryRunner.prototype.enableSqlMemory = function () {
        throw new Error("This operation is not supported by MongoDB driver.");
    };
    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    MongoQueryRunner.prototype.disableSqlMemory = function () {
        throw new Error("This operation is not supported by MongoDB driver.");
    };
    /**
     * Flushes all memorized sqls.
     */
    MongoQueryRunner.prototype.clearSqlMemory = function () {
        throw new Error("This operation is not supported by MongoDB driver.");
    };
    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    MongoQueryRunner.prototype.getMemorySql = function () {
        throw new Error("This operation is not supported by MongoDB driver.");
    };
    /**
     * Executes up sql queries.
     */
    MongoQueryRunner.prototype.executeMemoryUpSql = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("This operation is not supported by MongoDB driver.");
            });
        });
    };
    /**
     * Executes down sql queries.
     */
    MongoQueryRunner.prototype.executeMemoryDownSql = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("This operation is not supported by MongoDB driver.");
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Gets collection from the database with a given name.
     */
    MongoQueryRunner.prototype.getCollection = function (collectionName) {
        return this.databaseConnection.db(this.connection.driver.database).collection(collectionName);
    };
    return MongoQueryRunner;
}());
exports.MongoQueryRunner = MongoQueryRunner;

//# sourceMappingURL=MongoQueryRunner.js.map
