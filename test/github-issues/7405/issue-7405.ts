import "reflect-metadata";
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { Post } from "./entity/Post";
import { expect } from "chai";

describe.only("github issues > #7405 condition to enable where", () => {
    let connections: Connection[];
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should enable where if condition is true", () => Promise.all(
        connections.map(async (connection) => {
            const manager = connection.manager;

            const p1 = new Post(1, "Post #1");
            await manager.save(p1);

            const p2 = new Post(2, "Post #2");
            await manager.save(p2);

            const postRepository = manager.getRepository(Post);

            const searchTitle = "Post #1";
            const posts = await postRepository.createQueryBuilder("p")
                .andWhere("p.title = :title", { title: searchTitle}, !!searchTitle)
                .getMany();

            expect(posts.length).equal(1);
        })
    ));

    it("should not enable where if condition is false", () => Promise.all(
        connections.map(async (connection) => {
            const manager = connection.manager;

            const p1 = new Post(1, "Post #1");
            await manager.save(p1);

            const p2 = new Post(2, "Post #2");
            await manager.save(p2);

            const postRepository = manager.getRepository(Post);

            const searchTitle = undefined;
            const posts = await postRepository.createQueryBuilder("p")
                .andWhere("p.title = :title", { title: searchTitle}, searchTitle)
                .getMany();

            expect(posts.length).equal(2);
        })
    ));
});
