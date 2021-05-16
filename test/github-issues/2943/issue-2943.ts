import "reflect-metadata";
import { expect } from "chai";
import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Test } from "./entity/Test";

describe("github issues > #2943 Inappropriate migration generated", () => {

    let connections: Connection[];

    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ['mariadb', 'mysql'],
            entities: [Test],
            schemaCreate: true,
            dropSchema: true
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not create migrations for unsigned numeric types with no specified width", () =>
        Promise.all(connections.map(async (connection) => {
            const sqlInMemory = await connection.driver.createSchemaBuilder().log();

            expect(sqlInMemory.upQueries).to.eql([]);
            expect(sqlInMemory.downQueries).to.eql([]);
        })));
});
