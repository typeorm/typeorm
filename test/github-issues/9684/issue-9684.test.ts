import "reflect-metadata"
import type { DataSource } from "../../../src/index"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Foo } from "./entity/Foo"

describe("github issues > #9684 Incorrect enum default value when table name contains dash character", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Foo],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    after(() => closeTestingConnections(dataSources))
    it("should get default enum value", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("module-foo_table_x")

                const nameColumn = table!.findColumnByName("enumStatus")!
                nameColumn!.default!.should.be.equal("'draft'")
            }),
        ))
})
