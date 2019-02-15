import "reflect-metadata";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";

describe("github issues > #3647 Invalid inferred column type on composite foreign key", () => {
    let connections: Connection[];
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
                enabledDrivers: ["postgres"]
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should infer int type for user foreign key");
});
