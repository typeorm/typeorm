import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";

describe("github issues > #609 Custom precision on CreateDateColumn and UpdateDateColumn", () => {

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

    it("should create `CreateDateColumn` and `UpdateDateColumn` column with custom default", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        let table = await queryRunner.getTable("post");
        await queryRunner.release();

        table!.findColumnByName("createDate")!.default.should.be.equal("CURRENT_TIMESTAMP");
    })));

});
