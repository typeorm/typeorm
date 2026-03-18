import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"

describe("schema-builder > sync-unique-constraint-names", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            driverSpecific: { synchronize: false },
        })
    })
    afterAll(() => closeTestingConnections(dataSources))

    it("should sync when multiple entities have unique constraints on similarly named columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await expect(dataSource.synchronize()).to.eventually.be
                    .fulfilled
            }),
        ))
})
