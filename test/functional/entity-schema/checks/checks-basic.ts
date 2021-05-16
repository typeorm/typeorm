import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {PersonSchema} from "./entity/Person";
import {MysqlDriver} from "../../../../src/driver/mysql/MysqlDriver";

describe("entity-schema > checks", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [<any>PersonSchema],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should create a check constraints", () => Promise.all(connections.map(async connection => {
        // Mysql does not support check constraints.
        if (connection.driver instanceof MysqlDriver)
            return;

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("person");
        await queryRunner.release();

        table!.checks.length.should.be.equal(2);

    })));

});
