import "reflect-metadata";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../../../utils/test-utils";
import { Connection } from "../../../../../src/connection/Connection";
import { PersonSchema } from "./entity/Person";
import { equal } from "assert";

describe("entity-schema > indices > postgres", () => {
    let connections: Connection[];
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [<any>PersonSchema],
                enabledDrivers: ["postgres"]
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create a FULLTEXT index", () =>
        Promise.all(
            connections.map(async connection => {
                const expectedIndex = `CREATE INDEX text_search_index ON public.person USING gin ("FirstName" gin_trgm_ops)`;
                const indexName = PersonSchema.options.indices![0].name;
                const queryRunner = connection.createQueryRunner();
                const indices = await queryRunner.query(
                    `SELECT indexdef FROM pg_indexes WHERE indexname = '${indexName}'`
                );
                await queryRunner.release();

                equal(indices[0].indexdef, expectedIndex);
            })
        ));
});