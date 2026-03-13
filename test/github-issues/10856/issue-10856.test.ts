import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/index.js"
import { expect } from "chai"

describe("github issues > #10856 TypeORM Migration Bug: Duplicate Index Names in Generated Migration", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql"],
                logging: false,
            })),
    )

    after(() => closeTestingConnections(dataSources))

    it("Indexes on same column but different order generate a indexes with different names", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const schema = await queryRunner.getTable("user")
                await queryRunner.release()
                expect(schema!.indices[0].name).should.be.not.equal(
                    schema!.indices[1].name,
                )
            }),
        ))
})
