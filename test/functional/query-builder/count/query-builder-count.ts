import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {expect} from "chai";
import {Test} from "./entity/Test";
import {AmbigiousPrimaryKey} from "./entity/AmbigiousPrimaryKey";

describe("query builder > count", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Test, AmbigiousPrimaryKey],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("Count query should of empty table should be 0", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(Test);

        const count = await repo.count();
        expect(count).to.be.equal(0);
    })));

    it("Count query should count database values", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(Test);

        await Promise.all([
            repo.save({ varcharField: 'ok', uuidField: '123e4567-e89b-12d3-a456-426614174000', intField: 4}),
            repo.save({ varcharField: 'ok', uuidField: '123e4567-e89b-12d3-a456-426614174001', intField: 4}),
        ]);

        const count = await repo.count();
        expect(count).to.be.equal(2);
    })));

    it("Count query should handle ambiguous values", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(AmbigiousPrimaryKey);

        await Promise.all([
            repo.save({ a: 'A', b: 'AAA' }),
            repo.save({ a: 'AAA', b: 'A' }),
            repo.save({ a: 'AA', b: 'AA' }),
            repo.save({ a: 'BB', b: 'BB' }),
            repo.save({ a: 'B', b: 'BBB' }),
            repo.save({ a: 'BBB', b: 'B' })
        ]);

        const count = await repo.count();
        expect(count).to.be.equal(6, connection.name);
    })));

    it("counting joined query should count database values", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(Test);

        await Promise.all([
            repo.save({ varcharField: 'ok', uuidField: '123e4567-e89b-12d3-a456-426614174000', intField: 4}),
            repo.save({ varcharField: 'ok', uuidField: '123e4567-e89b-12d3-a456-426614174001', intField: 4}),
        ]);

        const count = await repo.createQueryBuilder()
            .from(Test, 'main')
            .leftJoin(Test, 'self', 'self.intField = main.intField')
            .getCount();

        expect(count).to.be.equal(2);
    })));

    it("counting joined queries should handle ambiguous values", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(AmbigiousPrimaryKey);

        await Promise.all([
            repo.save({ a: 'A', b: 'AAA' }),
            repo.save({ a: 'AAA', b: 'A' }),
            repo.save({ a: 'AA', b: 'AA' }),
            repo.save({ a: 'BB', b: 'BB' }),
            repo.save({ a: 'B', b: 'BBB' }),
            repo.save({ a: 'BBB', b: 'B' })
        ]);

        const count = await repo.createQueryBuilder()
            .from(AmbigiousPrimaryKey, 'main')
            .leftJoin(AmbigiousPrimaryKey, 'self', 'self.a = main.a')
            .getCount();

        expect(count).to.be.equal(6, connection.name);
    })));

});
