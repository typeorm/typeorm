import "reflect-metadata";
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { Block } from "./entity/Block";
import { PlanOfRecord } from "./entity/PlanOfRecord";

describe("github issues > #6714 Migration:generate issue with onUpdate using mariadb 10.4", () => {
    it("dont change anything", async () => {
        let connections: Connection[];
        connections = await createTestingConnections({
            entities: [Block, PlanOfRecord],
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: ["mssql"],
        });
        await reloadTestingDatabases(connections);
        await Promise.all(
            connections.map(async (connection) => {
                const schemaBuilder = connection.driver.createSchemaBuilder();
                const syncQueries = await schemaBuilder.log();
                expect(syncQueries.downQueries).to.be.eql([]);
                expect(syncQueries.upQueries).to.be.eql([]);
            })
        );
        await closeTestingConnections(connections);
    });
});
