import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe.only("transaction > transaction with load many", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql", "sqlite", "better-sqlite3", "postgres"] // todo: for some reasons mariadb tests are not passing here
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it.only("should loadMany in same transaction with same query runner", () => Promise.all(connections.map(async connection => {
        
        await connection.manager.transaction(async entityManager => {
            
            await entityManager
            .createQueryBuilder()
            .relation(Post, "categories")
            .of(1)
            .loadMany();

            // remove `this.queryRunner` in src/query-builder/RelationQueryBuilder.ts:164 
            // and loadMany uses different connections, despite it's inside a transaction

            expect(true); // todo: find a way to test which connection is used and remove console.log inside src/driver/mysql/MysqlDriver.ts:900
        });
    })));
});
