import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { RandomGenerator } from "../../../src/util/RandomGenerator";
import { assert, expect } from "chai";
import { Test } from "./entity/Test";

describe("github issues > #7094 EntityManager.insert() with explicit primary keys in input values are incorrectly remapped", () => {

    let connections: Connection[];

    const test1 = new Test();
    const uuid1 = RandomGenerator.uuid4();
    test1.id = uuid1;
    test1.value = "Post 1";

    const test2 = new Test();
    const uuid2 = RandomGenerator.uuid4();
    test2.id = uuid2;
    test2.value = "Post 2";

    const test3 = new Test();
    const uuid3 = RandomGenerator.uuid4();
    test3.id = uuid3;
    test3.value = "Post 3";

    const uuid4 = RandomGenerator.uuid4();
    const test4 = {
        id: uuid4,
        value: "Post 4"
    };

    const test5 = new Test();
    test5.value = "Post 5";

    const tests: Test[] = [test1, test2, test3, test4, test5];

    before(async () => connections = await createTestingConnections({
        enabledDrivers: ["sqlite"],
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not alter the input values object with explicit ids", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(Test);

        await connection.manager.insert(Test, tests);

        expect(tests[0].id).to.equal(uuid1);
        expect(tests[1].id).to.equal(uuid2);
        expect(tests[2].id).to.equal(uuid3);
        expect(tests[3].id).to.equal(uuid4);
        assert.isNotNull(tests[4].id);

        const items = await repo.find();

        expect(items).to.have.lengthOf(5);
        expect(items[0].id).to.equal(uuid1);
        expect(items[1].id).to.equal(uuid2);
        expect(items[2].id).to.equal(uuid3);
        expect(items[3].id).to.equal(uuid4);
        assert.isNotNull(items[4].id);
    })));
});
