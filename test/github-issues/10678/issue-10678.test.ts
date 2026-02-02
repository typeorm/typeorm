import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/user"

describe("github issues > #10678 useIndex is not preserved when cloning a QueryExpressionMap (or a QueryBuilder) instance", () => {
    let dataSources: DataSource[]
    beforeAll(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["aurora-mysql", "mysql", "mariadb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should preserve the useIndex property when a QueryBuilder instance is cloned", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const useIndex = "IDX_name"
                const qb = dataSource
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .useIndex(useIndex)

                expect(qb.expressionMap.useIndex).to.equal(useIndex)
                expect(qb.clone().expressionMap.useIndex).to.equal(useIndex)
            }),
        ))
})
