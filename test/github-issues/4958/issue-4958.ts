import {expect} from "chai";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import First from "./entity/first";
import Second from "./entity/second";

describe("github issues > #4958 getRepository returns results from another Repo", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [First, Second],
        enabledDrivers: ["sqlite"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("sql generated is for correct model", () => Promise.all(connections.map(async connection => {
        const rawSql = await connection
            .getRepository(Second)
            .createQueryBuilder("a")
            .getSql();

        expect(rawSql).to.be.equal('SELECT "a"."notId" AS "a_notId" FROM "second" "a"');
    })));
});
