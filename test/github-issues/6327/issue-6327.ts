import "reflect-metadata";
<<<<<<< HEAD
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
=======
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases, sleep } from "../../utils/test-utils";
>>>>>>> e99369cead3f73172f18969ee74d306c91032c9c
import { Connection } from "../../../src/connection/Connection";
import { Post } from "./entity/Post";

describe("github issues > #6327 softRemove DeleteDateColumn is null at Susbscriber's AfterUpdate method", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should send correct update and delete date columns to after update subscriber", () => Promise.all(connections.map(async connection => {

        const manager = connection.manager;

        const entity = new Post();
        await manager.save(entity);

        const deletedEntity = await manager.softRemove(entity, { data: { action: "soft-delete" } });
<<<<<<< HEAD

        await manager.recover(deletedEntity, { data: { action: "restore" } });
=======
        const softDeleteDate = deletedEntity!.updatedAt;

        await sleep(1000);

        await manager.recover(deletedEntity, { data: { action: "restore", softDeleteDate } });
>>>>>>> e99369cead3f73172f18969ee74d306c91032c9c

    })));

});
