import "reflect-metadata";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";

import { Master } from "./entities/master";
import { Detail } from "./entities/detail";

describe("github issues > #863 indices > create schema", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Master, Detail],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("build schema", function () {

        it("it should just work, creating the index", () => Promise.all(connections.map(async connection => {

            await connection.synchronize(true);

        })));

    });

});
