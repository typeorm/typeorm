import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {Brackets} from "../../../../src/query-builder/Brackets";

describe("query builder > brackets", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should put brackets correctly into WHERE expression", () => Promise.all(connections.map(async connection => {

        const user1 = new User();
        user1.firstName = "Timber";
        user1.lastName = "Saw";
        user1.isAdmin = false;
        await connection.manager.save(user1);

        const user2 = new User();
        user2.firstName = "Alex";
        user2.lastName = "Messer";
        user2.isAdmin = false;
        await connection.manager.save(user2);

        const user3 = new User();
        user3.firstName = "Umed";
        user3.lastName = "Pleerock";
        user3.isAdmin = true;
        await connection.manager.save(user3);

        const users = await connection.createQueryBuilder(User, "user")
            .where("user.isAdmin = :isAdmin", { isAdmin: true })
            .orWhere(new Brackets(qb => {
                qb.where("user.firstName = :firstName1", { firstName1: "Timber" })
                    .andWhere("user.lastName = :lastName1", { lastName1: "Saw" });
            }))
            .orWhere(new Brackets(qb => {
                qb.where("user.firstName = :firstName2", { firstName2: "Alex" })
                    .andWhere("user.lastName = :lastName2", { lastName2: "Messer" });
            }))
            .getMany();

        expect(users.length).to.be.equal(3);

    })));

});