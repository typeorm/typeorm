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
});
