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

describe.skip("github issues > #6752 column name not been find on unique index decorator", () => {
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
