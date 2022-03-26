import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #5067 ORA-00972: identifier is too long", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["oracle"],
            })),
    )
    after(() => closeTestingConnections(connections))

    it("generated parameter name is within the size constraints", () =>
        Promise.all(
            connections.map(async (connection) => {
                const paramName =
                    "output_that_is_really_long_and_must_be_truncated_in_this_driver"
                const createdParameter =
                    await connection.driver.createParameter(paramName, 0)

                expect(createdParameter).to.be.an("String")
                expect(createdParameter.length).to.be.lessThan(30)
            }),
        ))
})
