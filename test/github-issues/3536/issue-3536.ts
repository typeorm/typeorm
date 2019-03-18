import "reflect-metadata";
import { Connection } from "../../../src/connection/Connection";
import { closeTestingConnections, createTestingConnections } from "../../utils/test-utils";
import { PromiseUtils } from "../../../src";
import { Roles } from "./entity/Roles";

describe("github issues > #3536 Sync only works once for enums on entities with capital letters in entity name", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [
                Roles
            ],
            enabledDrivers: ["postgres"],
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should run without throw error", () => PromiseUtils.runInSequence(connections, async connection => {
        await connection.synchronize();
        await connection.synchronize();
    }));
});
