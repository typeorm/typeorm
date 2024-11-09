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
                const queryAndParameters =
                    PostSubscriber.receivedAfterUpdateEvents[0]
                        .queryAndParameters
                expect(queryAndParameters![0]).to.equal(
                    'UPDATE "post" SET "colToUpdate" = $1 WHERE "id" = $2',
                )
                expect(queryAndParameters![1]).to.deep.equal([1, id])
            }),
        ))

    it("if entity has been soft deleted via QueryBuilder, subscriber afterSoftRemove should receive queryAndParameters", () =>
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
                    .softDelete()
                    .from(Post)
                    .where("id = :id", { id })
                    .execute()
                const queryAndParameters =
                    PostSubscriber.receivedAfterSoftRemoveEvents[0]
                        .queryAndParameters
                expect(queryAndParameters![0]).to.equal(
                    'UPDATE "post" SET "deleteAt" = CURRENT_TIMESTAMP WHERE "id" = $1',
                )
                expect(queryAndParameters![1]).to.deep.equal([1])
            }),
        ))
})
