import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"

describe("query builder > order-by > sql injections", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not allow non-allowed values in order by direction", () => {
        dataSources.forEach((dataSource) => {
            expect(() => {
                dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id", "MIX" as any)
            }).to.throw(Error)
        })
    })

    it("should not allow non-allowed values in order by nulls option", () => {
        dataSources.forEach((dataSource) => {
            expect(() => {
                dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id", "DESC", "SOMETHING LAST" as any)
            }).to.throw(Error)
        })
    })

    it("should not allow SQL injection via order by direction", () => {
        dataSources.forEach((dataSource) => {
            expect(() => {
                dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id", "ASC; DROP TABLE post;--" as any)
            }).to.throw(Error)
        })
    })

    it("should not allow SQL injection via OrderByCondition object", () => {
        dataSources.forEach((dataSource) => {
            expect(() => {
                dataSource.manager.createQueryBuilder(Post, "post").orderBy({
                    "post.id": "ASC; DELETE FROM post;--" as any,
                })
            }).to.throw(Error)
        })
    })
})
