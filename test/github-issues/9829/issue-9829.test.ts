import "reflect-metadata"
import { DataSource } from "../../../src/index"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { ExampleEntity } from "./entity/ExampleEntity"

describe("github issues > #9829 Incorrect default value with concat value of function", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [ExampleEntity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    after(() => closeTestingConnections(dataSources))
    it("should get default concat value", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("example_entity")

                const nameColumn = table!.findColumnByName("someValue")!
                nameColumn!.default!.should.be.equal(
                    "('AA'|| COALESCE(NULL, '1'))",
                )
            }),
        ))
})
