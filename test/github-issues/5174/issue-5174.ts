import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../src";
import {Foo} from "./entity/Foo";
import {createTestingConnections, reloadTestingDatabases, closeTestingConnections} from '../../utils/test-utils';

describe("github issues > #5174 `selectQueryBuilder.take` messes up the query when using the `ids` parameter", () => {

    let connections: Connection[];

    before(async () => {
        connections = await createTestingConnections({
            entities: [Foo],
            schemaCreate: true,
            dropSchema: true
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should allow the 'ids' parameter without messing up the query when using .take", () =>
    Promise.all(connections.map(async (connection) => {
        const repository = connection.getRepository(Foo);

        await repository.save([
            { id: 1, type: 'a' },
            { id: 2, type: 'b' },
            { id: 3, type: 'a' },
            { id: 4, type: 'b' },
            { id: 5, type: 'b' },
            { id: 6, type: 'c' },
            { id: 7, type: 'c' },
            { id: 8, type: 'c' },
            { id: 9, type: 'b' },
            { id: 10, type: 'a' }
        ]);

        const results = await repository.createQueryBuilder('foo')
            .where('foo.type IN (:...ids)', { ids: ['b', 'c'] })
            .take(5)
            .getMany();

        expect(results).to.have.lengthOf(5);
    })));

});
