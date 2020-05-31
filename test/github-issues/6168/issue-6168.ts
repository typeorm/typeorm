import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {User} from "./entity/User";
import {UserType} from "./entity/UserType";
import {expect} from "chai";

describe("github issues > #6168 wrong foreign key information loaded from schema in mysql", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
                entities: [User, UserType ],
                enabledDrivers: ["mysql", "mariadb"],
                dropSchema: true,
            })
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should have equal foreign keys from schema and entities", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner("master");
        const metadataFromSchema = await queryRunner.connection.getMetadata(User);
        const metadataFromEntities = connection.getMetadata(User);
        return expect(metadataFromSchema).to.be.deep.equal(metadataFromEntities);
    })));
});
