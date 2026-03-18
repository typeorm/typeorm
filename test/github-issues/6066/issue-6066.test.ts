import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src"
import { QueryFailedError } from "../../../src"
import { Session } from "./entity/Session"
import { expect } from "chai"

describe("github issues > #6066 Column comment string is not escaped during synchronization", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Session],
            enabledDrivers: ["mysql", "mariadb"],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    afterAll(() => closeTestingConnections(dataSources))

    it("should synchronize", () =>
        Promise.all(
            dataSources.map((connection) => {
                return expect(connection.synchronize()).to.not.be.rejectedWith(
                    QueryFailedError,
                )
            }),
        ))
})
