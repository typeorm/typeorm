import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {expect} from "chai";

describe("driver > query runner > rename column", () => {

    let connections: Connection[] = [];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should rename a column", () => Promise.all(connections.map(async connection => {
        const user = new User();
        user.name = "Max";

        const userRepository = connection.getRepository(User);
        await userRepository.save(user);

        const queryRunner = connection.createQueryRunner();
        await queryRunner.renameColumn("user", "name", "firstname");

        const table = await queryRunner.getTable("user");

        expect(table).to.not.be.undefined;

        if (table) {
            const column = table.findColumnByName("firstname");
            expect(column).to.not.be.undefined;
        }

        const loadedUser = await connection.createQueryBuilder()
            .select()
            .from(User, "user")
            .select("user.id")
            .where("user.firstname = :name", {name: "Max"});

        expect(loadedUser).to.not.be.undefined;
    })));

});