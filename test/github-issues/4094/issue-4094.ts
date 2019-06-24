import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { Organization } from "./entity/Organization";

const expect = chai.expect;
chai.use(chaiAsPromised);

describe.only("github issues > #4094 Delete on JSON column: QueryFailedError: operator does not exist: json = unknown", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"],
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("shouldn't throw an error during deletion", () => Promise.all(connections.map(async connection => {
        const organization = new Organization();
        organization.name = "TEST";
        const result = await connection.manager.save(organization);
        await expect(connection.manager.delete(Organization, result.id)).to.not.be.rejected;
    })));

});
