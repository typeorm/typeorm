import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";

describe("query runner > has column", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly check if column exist", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        let hasIdColumn = await queryRunner.hasColumn("post", "id");
        let hasNameColumn = await queryRunner.hasColumn("post", "name");
        let hasVersionColumn = await queryRunner.hasColumn("post", "version");
        let hasDescriptionColumn = await queryRunner.hasColumn("post", "description");

        hasIdColumn.should.be.true;
        hasNameColumn.should.be.true;
        hasVersionColumn.should.be.true;
        hasDescriptionColumn.should.be.false;

        await queryRunner.release();
    })));

});
