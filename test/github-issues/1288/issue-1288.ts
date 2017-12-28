import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {expect} from "chai";
import {JoinEntity} from "./entity/JoinEntity";
import {TestEntity} from "./entity/TestEntity";

describe("github issues > #1288 db calculated columns (sql in @Column)", () => {

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
        // create objects to save
        const joinEntity1 = new JoinEntity();
        joinEntity1.spec = "Entity #1 spec (for TestEntity)";

        const testEntity1 = new TestEntity();
        testEntity1.name = "Entity #1";

        const testEntity2 = new TestEntity();
        testEntity2.name = "Entity #2";

        // persist
        await connection.manager.save([
            testEntity1,
            testEntity2
        ]);

        const queryBuilder = connection.manager.createQueryBuilder(TestEntity, "testEntity");

        const subQuery = queryBuilder
            .subQuery()
            .from(TestEntity, "innerTestEntity")
            .select(["id"])
            .where("innerTestEntity.id = :innerId", {innerId: 1});

        const results = await queryBuilder
            .select("testEntity")
            .where(`testEntity.id IN ${subQuery.getQuery()}`)
            .getMany();

        expect(results.length).to.be.equal(1);
        expect(results).to.eql([{id: 1, name: "Entity #1"}]);
    })));

});
