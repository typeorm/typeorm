import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("github issues > #12764 MSSQL lock hint should be inside nested join parentheses", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should place WITH (NOLOCK) inside parentheses for nested joins", () => {
        for (const dataSource of dataSources) {
            const sql = dataSource
                .createQueryBuilder(Post, "post")
                .setLock("dirty_read")
                .leftJoinAndSelect("post.author", "author")
                .leftJoinAndSelect("post.tag", "tag")
                .getSql()

            // The lock hint must appear immediately after the table alias,
            // before any nested join parentheses close.
            // Correct: FROM "post" "post" WITH (NOLOCK) LEFT JOIN ("user" "author" ...)
            // Incorrect: FROM "post" "post" LEFT JOIN (...) WITH (NOLOCK)
            expect(sql).to.contain('"post" "post" WITH (NOLOCK)')
            // Ensure lock hint is NOT after closing parenthesis of nested joins
            expect(sql).not.to.match(/\) WITH \(NOLOCK\)/)
        }
    })

    it("should place WITH (HOLDLOCK, ROWLOCK) inside parentheses for nested joins with pessimistic_read", () => {
        for (const dataSource of dataSources) {
            const sql = dataSource
                .createQueryBuilder(Post, "post")
                .setLock("pessimistic_read")
                .leftJoinAndSelect("post.author", "author")
                .leftJoinAndSelect("post.tag", "tag")
                .getSql()

            expect(sql).to.contain('"post" "post" WITH (HOLDLOCK, ROWLOCK)')
            expect(sql).not.to.match(/\) WITH \(HOLDLOCK, ROWLOCK\)/)
        }
    })

    it("should place WITH (UPDLOCK, ROWLOCK) inside parentheses for nested joins with pessimistic_write", () => {
        for (const dataSource of dataSources) {
            const sql = dataSource
                .createQueryBuilder(Post, "post")
                .setLock("pessimistic_write")
                .leftJoinAndSelect("post.author", "author")
                .leftJoinAndSelect("post.tag", "tag")
                .getSql()

            expect(sql).to.contain('"post" "post" WITH (UPDLOCK, ROWLOCK)')
            expect(sql).not.to.match(/\) WITH \(UPDLOCK, ROWLOCK\)/)
        }
    })
})
