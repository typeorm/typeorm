import "reflect-metadata";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { Post } from "./entity/Post";
import sinon from "sinon";
import { SelectQueryBuilder } from "../../../src";
import { assert } from "chai";

describe("github issues > #6266 Many identical selects after insert bunch of items", () => {
    let connections: Connection[];
    const posts: Post[] = [
        {
            title: "Post 1",
        },
        {
            title: "Post 2",
        },
        {
            title: "Post 3",
        },
        {
            title: "Post 4",
        },
    ];

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mysql"],
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should execute a single SELECT to get inserted default and generated values of multiple entities", () =>
        Promise.all(
            connections.map(async (connection) => {
                const selectSpy = sinon.spy(
                    SelectQueryBuilder.prototype,
                    "select"
                );

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(posts)
                    .execute();

                assert.strictEqual(selectSpy.calledOnce, true);

                selectSpy.restore();
            })
        ));
});
