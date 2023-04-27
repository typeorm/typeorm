import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { DataSource, TypeORMError } from "../../../src"
import { expect } from "chai"

describe("github issues > #9189 check invalid constraint options", () => {
    let dataSources: DataSource[] = []

    after(() => closeTestingConnections(dataSources))

    it("should throw an exception, when invalid option is configured", async () => {
        let err
        try {
            await Promise.all(
                (dataSources = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    schemaCreate: false,
                    dropSchema: true,
                    enabledDrivers: ["oracle"],
                })),
            )
        } catch (e) {
            err = e
        }
        if(err) // skip for other databases
        expect(err).to.eql(
            new TypeORMError(
                'OnDeleteType "RESTRICT" is not supported for oracle!',
            ),
        )
    })

    // you can add additional tests if needed
})
