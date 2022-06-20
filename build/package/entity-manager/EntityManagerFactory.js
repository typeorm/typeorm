"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityManagerFactory = void 0;
const EntityManager_1 = require("./EntityManager");
const MongoEntityManager_1 = require("./MongoEntityManager");
const SqljsEntityManager_1 = require("./SqljsEntityManager");
/**
 * Helps to create entity managers.
 */
class EntityManagerFactory {
    /**
     * Creates a new entity manager depend on a given connection's driver.
     */
    create(connection, queryRunner) {
        if (connection.driver.options.type === "mongodb")
            return new MongoEntityManager_1.MongoEntityManager(connection);
        if (connection.driver.options.type === "sqljs")
            return new SqljsEntityManager_1.SqljsEntityManager(connection, queryRunner);
        return new EntityManager_1.EntityManager(connection, queryRunner);
    }
}
exports.EntityManagerFactory = EntityManagerFactory;

//# sourceMappingURL=EntityManagerFactory.js.map
