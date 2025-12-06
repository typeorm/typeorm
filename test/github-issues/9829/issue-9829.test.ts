import "reflect-metadata"
import { DataSource } from "../../../src/index"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { ExampleEntity } from "./entity/ExampleEntity"
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

describe("github issues > #9829 Incorrect default value with concat value of function", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [ExampleEntity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    after(() => closeTestingConnections(connections))
    it("should get default concat value", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("example_entity")

                const nameColumn = table!.findColumnByName("someValue")!
                nameColumn!.default!.should.be.equal(
                    "('AA'|| COALESCE(NULL, '1'))",
                )
            }),
        ))
})
