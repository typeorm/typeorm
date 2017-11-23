import "reflect-metadata";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { EntityMetadata } from "../../../src/metadata/EntityMetadata";

import { Person } from "./entities/person";

describe("indices > create schema", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Person],
        schemaCreate: false,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("build schema", function () {

        it("it should drop the column and the referenced index", () => Promise.all(connections.map(async connection => {

            let entityMetadata: EntityMetadata = connection.getMetadata(Person);
            let idx: number = entityMetadata.columns.findIndex(x => x.databaseName === "firstname");
            entityMetadata.columns.splice(idx, 1);
            entityMetadata.indices = []; // clear the referenced index from metadata too            
            
            await connection.synchronize(false);

        })));

    });

});
