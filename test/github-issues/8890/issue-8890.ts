import "reflect-metadata"
import "../../utils/test-setup"
import { DataSource, IsNull } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { prepareData } from "./issue-8890-utils"

describe("github issues > #8890 it should be possible to query IS NULL on ManyToOne relations", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                __dirname,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("where IsNull", () =>
        Promise.all(
            connections.map(async (connection) => {
                await prepareData(connection.manager)

                const posts = await connection
                    .createQueryBuilder(Post, "post")
                    .setFindOptions({
                        where: {
                            author: IsNull(),
                        },
                    })
                    .orderBy("id", "ASC")
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
})
