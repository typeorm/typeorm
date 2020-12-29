import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Test } from "./entity/Test";
import { expect } from "chai";

describe("github issues > #3991 migration issues for timestamps with default values and precision", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Test],
        enabledDrivers: ["cockroachdb", "mariadb", "mysql", "postgres"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("can recognize model changes", async () => {
        await Promise.all(connections.map(async (connection) => {
            const sqlInMemory = await connection.driver.createSchemaBuilder().log();
            expect(sqlInMemory.upQueries).to.eql([]);
            expect(sqlInMemory.downQueries).to.eql([]);
        }));
    });

    it("does not generate when no model changes", () => Promise.all(connections.map(async connection => {
        await connection.driver.createSchemaBuilder().build();

        const sqlInMemory = await connection.driver.createSchemaBuilder().log();
        expect(sqlInMemory.upQueries).to.eql([]);
        expect(sqlInMemory.downQueries).to.eql([]);
    })));
});
