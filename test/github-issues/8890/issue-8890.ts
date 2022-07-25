import "reflect-metadata"
import "../../utils/test-setup"
import { DataSource, In, IsNull } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { prepareData } from "./issue-8890-utils"

describe("github issues > #8890 it should be possible to query IS NULL on ManyToOne relations", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                __dirname,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("where IsNull", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await prepareData(connection.manager)

                const posts = await connection
                    .createQueryBuilder(Post, "post")
                    .setFindOptions({
                        where: {
                            author: IsNull(),
                        },
                    })
                    .orderBy("post.id", "ASC")
                    .getMany()

                posts.should.be.eql([
                    {
                        id: 2,
                        title: "Post #2",
                        text: "About post #2",
                    },
                    {
                        id: 3,
                        title: "Post #3",
                        text: "About post #3",
                    },
                ])
            }),
        ))

    it("where In", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await prepareData(connection.manager)

                const posts = await connection
                    .createQueryBuilder(Post, "post")
                    .setFindOptions({
                        where: {
                            author: In([2, 3]),
                        },
                    })
                    .orderBy("post.id", "ASC")
                    .getMany()

                posts.should.be.eql([
                    {
                        id: 4,
                        title: "Post #4",
                        text: "About post #4",
                    },
                    {
                        id: 5,
                        title: "Post #5",
                        text: "About post #5",
                    },
                ])
            }),
        ))

    it("where IsNull OR In", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await prepareData(connection.manager)

                const posts = await connection
                    .createQueryBuilder(Post, "post")
                    .setFindOptions({
                        where: [
                            {
                                author: In([2, 3]),
                            },
                            {
                                author: IsNull(),
                            },
                        ],
                    })
                    .orderBy("post.id", "ASC")
                    .getMany()

                posts.should.be.eql([
                    {
                        id: 2,
                        title: "Post #2",
                        text: "About post #2",
                    },
                    {
                        id: 3,
                        title: "Post #3",
                        text: "About post #3",
                    },
                    {
                        id: 4,
                        title: "Post #4",
                        text: "About post #4",
                    },
                    {
                        id: 5,
                        title: "Post #5",
                        text: "About post #5",
                    },
                ])
            }),
        ))
})
