import "reflect-metadata";
import {expect} from "chai";

import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection, Like, Or, Equal} from "../../../src";

import {User} from "./entity/User";

describe("github issues > #2929 Allow specifying OR conditions in repository find options", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [ __dirname + "/entity/*{.js,.ts}" ],
        schemaCreate: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should generate an OR query", () => Promise.all(connections.map(async connection => {
        const repository = connection.getRepository(User);

        await repository.save([
            { firstName: "Timber", lastName: "Saw", age: 25 },
            { firstName: "John", lastName: "Doe", age: 21 },
            { firstName: "Jane", lastName: "Doe", age: 22 },
            { firstName: "Mark", lastName: "Anthony", age: 45 },
        ]);

        const users = await repository.find({
            where: {
                firstName: Like("Timb%"),
                lastName: Or(Equal("Doe")),
            }
        });

        expect(users).to.have.lengthOf(3);
        expect(users.map(user => user.firstName)).to.have.members(["Timber", "John", "Jane"]);
        expect(users.map(user => user.lastName)).to.have.members(["Doe", "Saw"]);
    })));
});
