import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";

describe("github issues > #4234 default value of @UpdateDateColumn is `CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)` ", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true
        });
    });
    after(() => closeTestingConnections(connections));

    it("should default value of `UpdateDateColumn` is `CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        let table = await queryRunner.getTable("post");
        await queryRunner.release();

        table!.findColumnByName("updateAt")!.default.should.be.equal("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
    })));

});
