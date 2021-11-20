import "reflect-metadata";
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases
} from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { Post } from "./entity/Post";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("github issues > #8393 When trying to update `update: false` column with `@UpdateDateColumn` the update column is updated", () => {
    let connections: Connection[];
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                logging: true,
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should return customers ordered by contacts", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post = new Post();
                post.title = "Control flow based type analysis";
                post.readOnlyColumn = 1;

                await connection.manager.save(post);

                await sleep(1000);

                await connection.manager.update(Post, post.id, {
                    // Make a change to read only column
                    readOnlyColumn: 2,
                });

                const updatedPost = await connection.manager.findOne(
                    Post,
                    post.id
                );

                expect(updatedPost).toBeDefined();

                expect(post.readOnlyColumn).to.be.equal(
                    updatedPost!.readOnlyColumn
                );

                // Gonna be false
                expect(post.lastUpdated).to.be.equal(updatedPost!.lastUpdated);
            })
        ));
});
