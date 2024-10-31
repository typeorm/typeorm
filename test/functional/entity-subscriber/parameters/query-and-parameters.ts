import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../test/utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { PostSubscriber } from "./subscriber/PostSubscriber"

describe("afterUpdate queryAndParameters", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("if entity has been updated via QueryBuilder, subscriber afterUpdate should receive queryAndParameters", () =>
        Promise.all(
            connections.map(async function (connection) {
                const repo = connection.getRepository(Post)
                const insertPost = new Post()
                await repo.save(insertPost)
                const createdPost = await repo.findOneBy({ id: insertPost.id })
                expect(createdPost).not.to.be.null
                const { id } = createdPost!
                await repo.manager
                    .createQueryBuilder()
                    .update(Post)
                    .set({ colToUpdate: 1 })
                    .where("id = :id", { id })
                    .execute()
                const queryAndParameters = PostSubscriber.receivedEvents[0].queryAndParameters
                expect(queryAndParameters![0]).to.equal('UPDATE "post" SET "colToUpdate" = $1 WHERE "id" = $2')
                expect(queryAndParameters![1]).to.deep.equal([1, id])
            }),
        ))
})
