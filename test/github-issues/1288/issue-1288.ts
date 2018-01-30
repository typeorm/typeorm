import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {expect} from "chai";
import {TestEntity} from "./entity/TestEntity";

describe("github issues > #1288 check calculated columns (sql in @Column)", () => {

    let connections: Connection[];
    before(async () => {
        return connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"]
        });
    });
    beforeEach(() => {
        return reloadTestingDatabases(connections);
    });
    after(() => {
        return closeTestingConnections(connections);
    });

    it("should persist successfully and return entity", () => Promise.all(connections.map(async connection => {
        const testEntity1 = new TestEntity();
        testEntity1.name = "Entity #1";

        const testEntity2 = new TestEntity();
        testEntity2.name = "Entity #2";


        await connection.manager.save([
            testEntity1,
            testEntity2
        ]);


        const queryBuilder = connection.manager.createQueryBuilder(TestEntity, "testEntity");

        const results = await queryBuilder
            .where("name = 'Entity #1'")
            .getMany();

        console.log("DEBUG", results, connection.driver.options.name);
        expect(results.length).to.be.eq(1);
        expect(results).to.eql([{
            id: 1,
            name: "Entity #1",
            width: 1,
            height: 1,
            idName_area: 2,
            idName: "1 + Entity #1",
        }]);
    })));
});
