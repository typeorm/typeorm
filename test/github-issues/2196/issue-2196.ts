import "reflect-metadata";
import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections } from "../../utils/test-utils";
import { Example } from "./entity/Example";
import { expect } from "chai";


describe("github issues > add option to sync schema not drop columns", () => {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let connections: Connection[] = [];

    beforeEach(async () => connections = await createTestingConnections({
        entities: [Example],
        schemaCreate: true,
        synchronizeWithoutDrops: true
    }));
    afterEach(() => closeTestingConnections(connections));

    it("should not change the length of name column", () => Promise.all(connections.map(async connection => {
        let metadata = connection.getMetadata(Example);
        const originalColumnLength = metadata.findColumnWithPropertyName("name")!.length;

        metadata.findColumnWithPropertyName("name")!.length = "1000";
        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("example");
        await queryRunner.release();

        expect(table!.findColumnByName("name")!.length).to.be.equal(originalColumnLength);
    })));

    it("should not drop the column", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        let metadata = connection.getMetadata(Example);
        metadata.columns = [metadata.findColumnWithPropertyName("id")!];
        await connection.synchronize();

        const table = await queryRunner.getTable("example");
        await queryRunner.release();

        expect(table!.findColumnByName("name")!).to.be.exist;
    })));
});
