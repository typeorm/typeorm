import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("github issues > #4842 QueryExpressionMap doesn't clone distinct property", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should contain correct distinct value after query builder is cloned", () => {
        dataSources.forEach((connection) => {
            const query = connection.manager
                .createQueryBuilder(Post, "post")
                .distinct()
                .disableEscaping()
            const sqlWithDistinct = query.getSql()

            expect(query.clone().getSql()).to.equal(sqlWithDistinct)
        })
    })
})
