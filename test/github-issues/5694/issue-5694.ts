import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"

describe("github issues > #5694 findOne with relations does two queries", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not try to paginate when skip is undefined and take is defined", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const builder = dataSource
                    .getRepository(Post)
                    .createQueryBuilder()
                const createOrderByCombinedWithSelectExpression =
                    builder["createOrderByCombinedWithSelectExpression"]

                let called = true

                builder["createOrderByCombinedWithSelectExpression"] = (
                    ...args
                ) => {
                    called = true
                    return createOrderByCombinedWithSelectExpression.apply(
                        builder,
                        args,
                    )
                }

                await builder.setFindOptions({ take: 1 }).getOne()

                expect(called).to.be.false

                builder["createOrderByCombinedWithSelectExpression"] =
                    createOrderByCombinedWithSelectExpression
            }),
        ))
})
