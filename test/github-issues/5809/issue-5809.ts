import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../src";
import {User} from "./entity/User";
import {Role} from "./entity/Role";
import {createTestingConnections, reloadTestingDatabases, closeTestingConnections} from "../../utils/test-utils";

describe("github issues > #5809 Increment parameter index after relation condition", () => {

    let connections: Connection[];

    before(async () => {
        connections = await createTestingConnections({
            entities: [User, Role],
            schemaCreate: true,
            dropSchema: true
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should increment parameter index after relation condition", () =>
    Promise.all(connections.map(async (connection) => {
        const roleRepository = connection.getRepository(Role);
        const userRepository = connection.getRepository(User);

        await roleRepository.save([
            { id: "a", users: [{ id: 1 }] },
        ]);

        const results = await userRepository.createQueryBuilder("user")
            .where({
                role: { id: "a" },
                id: 1,
            })
            .getMany();

        expect(results).to.be.deep.equal([
            { id: 1 },
        ]);
    })));

});
