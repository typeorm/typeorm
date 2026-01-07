import { expect } from "chai"
import { TypeORMError } from "../../../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../../../utils/test-utils"
import { User2 } from "../entity/User2"
import { User3 } from "../entity/User3"

describe("github issues > Add support of 'hash' indexes for postgres", () => {
    it("Should throw an error if index type is set and sqlite does not support index types", async () => {
        const connections = await createTestingConnections({
            entities: [User3],
            enabledDrivers: ["sqlite"],
            schemaCreate: true,
        })

        const isSqlite = connections.length > 0

        if (isSqlite) {
            await closeTestingConnections(connections)
            await expect(
                createTestingConnections({
                    entities: [User2],
                    enabledDrivers: ["sqlite"],
                    schemaCreate: true,
                }),
            ).to.be.rejectedWith(TypeORMError)
        }
    })
})
