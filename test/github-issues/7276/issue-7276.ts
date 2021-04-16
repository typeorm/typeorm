import "reflect-metadata";
import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {ClusterCluster} from "./entity/Test";

describe("github issues > #7276 Schema sync not able to find diff correctly and executes same queries on every run", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        enabledDrivers: ["postgres"],
        schemaCreate: false,
        dropSchema: true,
        entities: [ClusterCluster],
    }));
    after(() => closeTestingConnections(connections));

    it("should recognize model changes", () => Promise.all(connections.map(async connection => {
        const sqlInMemory = await connection.driver.createSchemaBuilder().log();
        sqlInMemory.upQueries.length.should.be.greaterThan(0);
        sqlInMemory.downQueries.length.should.be.greaterThan(0);
    })));

    it("should not generate queries when no model changes", () => Promise.all(connections.map(async connection => {
        await connection.driver.createSchemaBuilder().build();
        const sqlInMemory = await connection.driver.createSchemaBuilder().log();
        sqlInMemory.upQueries.length.should.be.equal(0);
        sqlInMemory.downQueries.length.should.be.equal(0);
    })));
});
