import "reflect-metadata";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { EquipmentModel } from "./entity/EquipmentModel";
import { expect } from "chai";


describe("github issues > #3587 do not generate change queries for number based enum types every time", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [EquipmentModel],
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should NOT generate change queries in case enum is not changed", () => Promise.all(connections.map(async function (connection) {

        await connection.synchronize(true);

        const sqlInMemory = await connection.driver.createSchemaBuilder().log();

        expect(sqlInMemory.downQueries).to.be.eql([]);
        expect(sqlInMemory.upQueries).to.be.eql([]);
    })));

});
