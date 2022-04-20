"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoSchemaBuilder = void 0;
var tslib_1 = require("tslib");
var SqlInMemory_1 = require("../driver/SqlInMemory");
/**
 * Creates complete tables schemas in the database based on the entity metadatas.
 *
 * Steps how schema is being built:
 * 1. load list of all tables with complete column and keys information from the db
 * 2. drop all (old) foreign keys that exist in the table, but does not exist in the metadata
 * 3. create new tables that does not exist in the db, but exist in the metadata
 * 4. drop all columns exist (left old) in the db table, but does not exist in the metadata
 * 5. add columns from metadata which does not exist in the table
 * 6. update all exist columns which metadata has changed
 * 7. update primary keys - update old and create new primary key from changed columns
 * 8. create foreign keys which does not exist in the table yet
 * 9. create indices which are missing in db yet, and drops indices which exist in the db, but does not exist in the metadata anymore
 */
var MongoSchemaBuilder = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function MongoSchemaBuilder(connection) {
        this.connection = connection;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates complete schemas for the given entity metadatas.
     */
    MongoSchemaBuilder.prototype.build = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, promises;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = this.connection.createQueryRunner();
                        promises = [];
                        this.connection.entityMetadatas.forEach(function (metadata) {
                            metadata.indices.forEach(function (index) {
                                var options = Object.assign({}, {
                                    name: index.name,
                                    unique: index.isUnique,
                                    sparse: index.isSparse,
                                    background: index.isBackground
                                }, index.expireAfterSeconds === undefined
                                    ? {}
                                    : { expireAfterSeconds: index.expireAfterSeconds });
                                promises.push(queryRunner.createCollectionIndex(metadata.tableName, index.columnNamesWithOrderingMap, options));
                            });
                            metadata.uniques.forEach(function (unique) {
                                var options = {
                                    name: unique.name,
                                    unique: true,
                                };
                                promises.push(queryRunner.createCollectionIndex(metadata.tableName, unique.columnNamesWithOrderingMap, options));
                            });
                        });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns query to be executed by schema builder.
     */
    MongoSchemaBuilder.prototype.log = function () {
        return Promise.resolve(new SqlInMemory_1.SqlInMemory());
    };
    return MongoSchemaBuilder;
}());
exports.MongoSchemaBuilder = MongoSchemaBuilder;

//# sourceMappingURL=MongoSchemaBuilder.js.map
