import { EntityManager } from "./EntityManager";
import { MongoEntityManager } from "./MongoEntityManager";
import { MongoDriver } from "../driver/mongodb/MongoDriver";
import { SqljsEntityManager } from "./SqljsEntityManager";
import { SqljsDriver } from "../driver/sqljs/SqljsDriver";
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
        if (connection.driver instanceof MongoDriver)
            return new MongoEntityManager(connection);
        if (connection.driver instanceof SqljsDriver)
            return new SqljsEntityManager(connection, queryRunner);
        return new EntityManager(connection, queryRunner);
    };
    return EntityManagerFactory;
}());
export { EntityManagerFactory };

//# sourceMappingURL=EntityManagerFactory.js.map
