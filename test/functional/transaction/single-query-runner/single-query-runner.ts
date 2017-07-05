import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe("transaction > single query runner", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should execute all operations in the method in a transaction", () => Promise.all(connections.map(async connection => {
        return connection.transaction(async transactionalEntityManager => {
            const originalQueryRunner = transactionalEntityManager.queryRunner;

            expect(originalQueryRunner).to.exist;
            expect(transactionalEntityManager.getRepository(Post).queryRunner).to.exist;
            transactionalEntityManager.getRepository(Post).queryRunner!.should.be.equal(originalQueryRunner);
            transactionalEntityManager.getRepository(Post).manager.should.be.equal(transactionalEntityManager);
        });

    })));

});
