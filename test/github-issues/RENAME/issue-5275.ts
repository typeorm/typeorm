import "reflect-metadata";
import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { User, Role } from "./entity/User";
import { UserTwo } from "./entity/UserTwo";

describe.only("github issues > #5275 Enums with spaces are not converted properly.", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["postgres"]
    }));

    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly parse enums of strings with spaces", () => Promise.all(connections.map(async connection => {
        const userRepository = connection.getRepository(User);

        await userRepository.save({ id: 1, roles: [Role.GuildMaster, Role.Officer, Role.Number, Role.PlayerAlt] });

        const user = await userRepository.findOneOrFail(1);

        user.should.eql({
            id: 1,
            roles: ["Guild Master", "Officer", 1, "Player Alt"]
        });
    })));

    it("should correctly parse non-array enums with spaces", () => Promise.all(connections.map(async connection => {
        const userRepository = connection.getRepository(UserTwo);

        await userRepository.save({ id: 1, role: Role.GuildMaster });

        const user = await userRepository.findOneOrFail(1);

        user.should.eql({
            id: 1,
            role: "Guild Master"
        });
    })));
});
