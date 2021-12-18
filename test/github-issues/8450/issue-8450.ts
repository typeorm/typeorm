import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {UserEntity} from "./entity/UserEntity";
import {expect} from "chai";

describe("github issues > #8450 Generated column not in RETURNING clause on save - PostgreSQL database", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should populate an object with generated column values after saving", () => Promise.all(connections.map(async connection => {
        const user = new UserEntity();

        expect(user.generated).to.be.undefined;

        await connection.manager.save(user);

        expect(user.id).not.to.be.undefined;
        expect(user.id).to.be.a("number");
        expect(user.generated).to.be.a("number");
        expect(user.generated).to.be.equal(user.id * 2);
    })));

});
