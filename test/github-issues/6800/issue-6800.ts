import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../src";
import {User} from "./entity/User";
import {Role} from "./entity/Role";
import {createTestingConnections, reloadTestingDatabases, closeTestingConnections} from "../../utils/test-utils";

describe("github issues > #6800 fix performance and wrong foreign key in mysql", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
                entities: [User, Role],
                enabledDrivers: ["mysql", "mariadb"],
                dropSchema: true,
            })
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should have equal foreign keys from schema and entities", () => Promise.all(connections.map(async connection => {
        console.log("heeeeere");
        const queryRunner = connection.createQueryRunner("master");
        const metadataFromSchema = await queryRunner.connection.getMetadata(User);
        const metadataFromEntities = connection.getMetadata(User);
        return expect(metadataFromSchema).to.be.deep.equal(metadataFromEntities);
    })));
});
