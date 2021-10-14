import "reflect-metadata";
import {Connection} from "../../../src";
import {createTestingConnections, closeTestingConnections} from "../../utils/test-utils";
import {User} from "./entity/User";

describe("github issues > #8273 Adding @Generated('uuid') doesn't update column default. PostgreSQL", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        migrations: [],
        enabledDrivers: ["postgres"],
        schemaCreate: false,
        dropSchema: true,
        entities: [User],
    }));
    after(() => closeTestingConnections(connections));

    it("changes default when generated is removed", () => Promise.all(connections.map(async connection => {
        await connection.driver.createSchemaBuilder().build();

        const queryRunner = connection.createQueryRunner();
        let table = await queryRunner.getTable("user");
        const column = table!.findColumnByName("uuidWithGenerated")!;
        const newColumn = column.clone();
        newColumn.isGenerated = false;
        newColumn.generationStrategy = undefined;

        const sqlInMemory = await connection.driver.createSchemaBuilder().log();
        sqlInMemory.upQueries.length.should.be.greaterThan(0);
        sqlInMemory.downQueries.length.should.be.greaterThan(0);
    })));
});
