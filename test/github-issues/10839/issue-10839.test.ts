import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #10839 property names followed by a newline or tab are not escaped", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["better-sqlite3", "sqljs"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should escape a property name at the end of a line in a where condition", () => {
        for (const dataSource of dataSources) {
            const sql = dataSource
                .getRepository(Post)
                .createQueryBuilder("post")
                .where(
                    `
                        :authorId = post.authorId
                        or
                        :categoryId = post.categoryId
                    `,
                    { authorId: 1, categoryId: 2 },
                )
                .getSql()

            expect(sql).to.include(`= "post"."authorId"`)
            expect(sql).to.include(`= "post"."categoryId"`)
            expect(sql).to.not.match(/\bpost\.(authorId|categoryId)\b/)
        }
    })

    it("should escape a property name at the end of a line in a join condition", () => {
        for (const dataSource of dataSources) {
            const sql = dataSource
                .getRepository(Post)
                .createQueryBuilder("post")
                .leftJoin(
                    Post,
                    "other",
                    `
                        other.authorId = post.authorId
                        or
                        other.categoryId = post.categoryId
                    `,
                )
                .getSql()

            expect(sql).to.include(`"other"."authorId" = "post"."authorId"`)
            expect(sql).to.include(`"other"."categoryId" = "post"."categoryId"`)
            expect(sql).to.not.match(/\b(post|other)\.(authorId|categoryId)\b/)
        }
    })

    it("should escape property names separated by tabs", () => {
        for (const dataSource of dataSources) {
            const sql = dataSource
                .getRepository(Post)
                .createQueryBuilder("post")
                .where(
                    "post.authorId\t=\t:authorId\tand\tpost.categoryId = :categoryId",
                    { authorId: 1, categoryId: 2 },
                )
                .getSql()

            expect(sql).to.include(`"post"."authorId"\t=\t`)
            expect(sql).to.include(`\t"post"."categoryId" = `)
            expect(sql).to.not.match(/\bpost\.(authorId|categoryId)\b/)
        }
    })
})
