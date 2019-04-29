import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {expect} from "chai";
import {Connection} from "../../../src/connection/Connection";

describe("github issues > #4063 [Postgres] Query runner generates wrong PK name (with custom schema)", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        enabledDrivers: ["postgres"],
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schema: "custom",
        schemaCreate: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should generate correct PK name", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        const textColumn = table!.findColumnByName("id")!;
        table!.findColumnByName("id")!.isPrimary.should.be.true;

        const renamedTextColumn = textColumn!.clone();
        renamedTextColumn.name = "extId";

        await queryRunner.renameColumn(table!, textColumn, renamedTextColumn);

        table = await queryRunner.getTable("post");
        expect(table!.findColumnByName("id")).to.be.undefined;
        table!.findColumnByName("extId")!.should.be.exist;
        table!.findColumnByName("extId")!.isPrimary.should.be.true;

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        expect(table!.findColumnByName("extId")).to.be.undefined;

        await queryRunner.release();
    })));

});
