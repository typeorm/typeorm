"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityManagerFactory = void 0;
var EntityManager_1 = require("./EntityManager");
var MongoEntityManager_1 = require("./MongoEntityManager");
var MongoDriver_1 = require("../driver/mongodb/MongoDriver");
var SqljsEntityManager_1 = require("./SqljsEntityManager");
var SqljsDriver_1 = require("../driver/sqljs/SqljsDriver");
/**
 * Helps to create entity managers.
 */
var EntityManagerFactory = /** @class */ (function () {
    function EntityManagerFactory() {
    }
    /**
     * Creates a new entity manager depend on a given connection's driver.
     */
    EntityManagerFactory.prototype.create = function (connection, queryRunner) {
        if (connection.driver instanceof MongoDriver_1.MongoDriver)
            return new MongoEntityManager_1.MongoEntityManager(connection);
        if (connection.driver instanceof SqljsDriver_1.SqljsDriver)
            return new SqljsEntityManager_1.SqljsEntityManager(connection, queryRunner);
        return new EntityManager_1.EntityManager(connection, queryRunner);
    };
    return EntityManagerFactory;
}());
exports.EntityManagerFactory = EntityManagerFactory;

//# sourceMappingURL=EntityManagerFactory.js.map
