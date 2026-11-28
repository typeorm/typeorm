import { expect } from "chai"
import type { DataSource } from "../../../src"
import { In, IsNull, Not } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Author } from "./entity/Author"
import { Post } from "./entity/Post"

describe("github issues > #13090 IsNull() on a relation with an exposed join column is lost in QueryBuilder.where", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["sqljs"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should generate IS NULL and return posts without an author", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const authors = dataSource.getRepository(Author)
                const posts = dataSource.getRepository(Post)
                const author = await authors.save({})
                await posts.save([
                    { authorId: (author as Author).id },
                    { authorId: null },
                ])

                const qb = posts
                    .createQueryBuilder("post")
                    .where({ author: IsNull() })

                const [sql, params] = qb.getQueryAndParameters()
                expect(sql).to.contain("IS NULL")
                expect(sql).to.not.contain("= ?")
                expect(params).to.be.empty
                expect(await qb.getMany()).to.have.length(1)
            }),
        ))

    it("should keep Not(IsNull()) and In() FindOperators on relations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const authors = dataSource.getRepository(Author)
                const posts = dataSource.getRepository(Post)
                const author = await authors.save({})

                const notNull = await posts
                    .createQueryBuilder("post")
                    .where({ author: Not(IsNull()) })
                    .getMany()
                expect(notNull).to.have.length(0)

                await posts.save({
                    authorId: (author as Author).id,
                })
                const inRows = await posts
                    .createQueryBuilder("post")
                    .where({ author: In([(author as Author).id]) })
                    .getMany()
                expect(inRows).to.have.length(1)
            }),
        ))
})
