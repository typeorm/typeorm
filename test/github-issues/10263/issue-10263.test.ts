import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Space } from "./entity/Space"

describe("github issues > #10263 closure table should inherit entity schema", () => {
    let dataSources: DataSource[]

    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Space],
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: false,
        })
    })

    afterAll(() => closeTestingConnections(dataSources))

    it("should set the same schema on the closure junction table as the parent entity", () => {
        dataSources.forEach((dataSource) => {
            const spaceMetadata = dataSource.getMetadata(Space)

            expect(spaceMetadata.schema).to.equal("my_schema")
            expect(spaceMetadata.closureJunctionTable).to.not.be.undefined
            expect(spaceMetadata.closureJunctionTable.schema).to.equal(
                "my_schema",
            )
            expect(spaceMetadata.closureJunctionTable.tablePath).to.contain(
                "my_schema",
            )
        })
    })
})
