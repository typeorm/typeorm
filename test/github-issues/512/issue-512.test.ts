import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #512 Table name escaping in UPDATE in QueryBuilder", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should escape table name using driver's escape function in UPDATE", () => {
        connections.forEach((connection) => {
            const driver = connection.driver
            const queryBuilder = connection.manager.createQueryBuilder(
                Post,
                "post",
            )
            const query = queryBuilder
                .update({
                    title: "Some Title",
                })
                .getSql()

            expect(query).to.deep.contain(driver.escape("Posts"))
        })
    })
})
