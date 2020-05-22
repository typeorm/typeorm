import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Settings} from "./entity/Settings";
import {expect} from "chai";

describe("github issues > #3874 Using an (empty string) enum as the type of a primary key column", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Settings],
        enabledDrivers: ["mysql", "mariadb"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should reload entity", () => Promise.all(connections.map(async connection => {
        // Create initial settings row
        const newSettings = new Settings();
        newSettings.value = "string";
        await connection.manager.save(newSettings);
        // Attempt to read settings back
        const foundSettings = await connection.manager.findOne(Settings);
        expect(foundSettings).to.be.an.instanceOf(Settings);
        expect(foundSettings != null ? foundSettings.value : null).to.equal("string");
    })));

});
