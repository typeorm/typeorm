import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {In} from "../../../src";
import {User} from "./entity/User";

describe("other issues > find operator in crashing when passed empty parameters", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not crashed when passed empty parameters", () => Promise.all(connections.map(async function(connection) {
        let error = null;
        try {
            await connection.getRepository(User).find({
                where: {
                    uuid: In([])
                }
            });
        } catch (e) {
            error = e;
        }
        expect(error).to.equal(null);
    })));

    it("should return nothing if the array passed to the In operator is empty", () => () => Promise.all(connections.map(async function(connection) {
        const repository = connection.getRepository(User)
        const newUser = repository.create()
        const user = await repository.save(newUser)

        const users = await connection.getRepository(User).find({
            where: {
                uuid: In([user.uuid])
            }
        })

        expect(users.length).to.equal(1)

        const usersEmptyIn = await connection.getRepository(User).find({
            where: {
                uuid: In([])
            }
        })

        expect(usersEmptyIn.length).to.equal(0);
    })));
});
