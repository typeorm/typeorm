import "reflect-metadata"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("github issues > #4842 QueryExpressionMap doesn't clone distinct property", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should contain correct distinct value after query builder is cloned", () => {
        connections.forEach((connection) => {
            const query = connection.manager
                .createQueryBuilder(Post, "post")
                .distinct()
                .disableEscaping()
            const sqlWithDistinct = query.getSql()

            expect(query.clone().getSql()).to.equal(sqlWithDistinct)
        })
    })
})
