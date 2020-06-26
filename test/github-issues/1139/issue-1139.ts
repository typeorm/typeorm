import "reflect-metadata";
import { closeTestingConnections, createTestingConnections } from "../../utils/test-utils";
import { Connection } from "@typeorm/core";

describe("github issues > #1139 mysql primary generated uuid ER_TOO_LONG_KEY", () => {
    let connections: Connection[];
    after(() => closeTestingConnections(connections));
    it("correctly create primary generated uuid column", async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"],
        schemaCreate: true,
        dropSchema: true,
    }));
});
