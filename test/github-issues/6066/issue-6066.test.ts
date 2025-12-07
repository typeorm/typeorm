import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { QueryFailedError, DataSource } from "../../../src"
import { Session } from "./entity/Session"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("github issues > #6066 Column comment string is not escaped during synchronization", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Session],
                enabledDrivers: ["mysql", "mariadb"],
                schemaCreate: false,
                dropSchema: true,
            })),
    )
    after(() => closeTestingConnections(connections))

    it("should synchronize", () =>
        Promise.all(
            connections.map((connection) => {
                return expect(connection.synchronize()).to.not.be.rejectedWith(
                    QueryFailedError,
                )
            }),
        ))
})
