import "reflect-metadata"
import { expect } from "chai"
import type { ValueUnion } from "./entity/Test"
import { Test } from "./entity/Test"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { LessThan } from "../../../src"

describe("github issues > #9152 Can't use LessThan for Union field", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Test],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not raise TypeScript error when LessThan with Union is passed to FindOptionsWhere", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.getRepository(Test).save({
                    value: 1,
                })

                const value = 2 as ValueUnion

                const count = await connection.getRepository(Test).countBy({
                    value: LessThan(value),
                })

                expect(count).to.eq(1)
            }),
        ))
})
