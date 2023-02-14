import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { expect } from "chai"

describe("github issues > #9189 check invalid constraint options", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: false,
                dropSchema: true,
                enabledDrivers: ["oracle"],
            })),
    )
    after(() => closeTestingConnections(dataSources))

    it("should throw an exception, when invalid option is configured", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let error
                try {
                    await dataSource.driver.createSchemaBuilder().log()
                } catch (e) {
                    error = e
                }
                expect(error).to.eql(
                    new Error("RESTRICT not a valid option for oracle!"),
                )
            }),
        ))

    // you can add additional tests if needed
})
