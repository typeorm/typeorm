import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {Counter} from "./entity/Counter";

describe("github issues > #6174 QueryBuilder generates invalid SQL for update when using both `returning` and `order by`", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should support ORDER BY .. LIMIT .. RETURNING", () => Promise.all(connections.map(async connection => {
        if (!connection.driver.isReturningSqlSupported()) {
            return;
        }

        await connection.manager.insert(Counter, [
            { value: 0 },
            { value: 2 },
            { value: 4 },
        ]);

        const { raw: counters } = await connection.createQueryBuilder()
            .update(Counter)
            .set({
                value: () => "value + 1",
            })
            .where("value < 10")
            .orderBy("value", "ASC")
            .limit(1)
            .returning("*")
            .execute();

        expect(counters).to.exist;
        expect(counters!.length).to.be(1 as any);
        expect(counters![0]).to.be.an.instanceOf(Counter);
        expect(counters![0].value).to.be(1 as any);

        const {unchanged} = await connection.createQueryBuilder(Counter, "c")
            .select("COUNT(c.id)", "unchanged")
            .where("c.value != 1")
            .getRawOne();

        expect(unchanged).to.be(2 as any);
    })));

    // you can add additional tests if needed

});
