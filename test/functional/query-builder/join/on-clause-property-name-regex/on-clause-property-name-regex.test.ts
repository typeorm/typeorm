import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Author } from "./entity/Author"
import { Abbreviation } from "./entity/Abbreviation"

describe("query-builder > join > on-clause property-name regex", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not rewrite column references whose prefix matches a relation name", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const author = new Author()
                author.name = "John Doe"
                await connection.manager.save(author)

                const abbrev = new Abbreviation()
                abbrev.name = "test"
                await connection.manager.save(abbrev)

                const post = new Post()
                post.author = author
                post.abbreviation = abbrev
                await connection.manager.save(post)

                // The generated query must end with `ON p.abbreviation_id = ab.id`,
                // not `ON p.abbreviation.id = ab.id` (the second form is a SQL
                // error). Historically an unescaped dot in the ON-clause regex
                // caused the column-id suffix to be mis-rewritten when the
                // relation property name was a prefix of the column name.
                const loadedPosts = await connection.manager
                    .createQueryBuilder(Post, "p")
                    .leftJoinAndMapOne(
                        "p.author",
                        Author,
                        "n",
                        "p.author_id = n.id",
                    )
                    .leftJoinAndMapOne(
                        "p.abbreviation",
                        Abbreviation,
                        "ab",
                        "p.abbreviation_id = ab.id",
                    )
                    .getMany()

                loadedPosts.length.should.be.equal(1)
            }),
        ))
})
