import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"
import { ExampleEntity } from "./entity/exampleEntity"

describe("github issues > #10616 How to set AUTO_INCREMENT=10000", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [ExampleEntity],
            enabledDrivers: ["mysql", "mariadb"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("has the first inserted value with id 50", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const inserted = await dataSource
                    .getRepository(ExampleEntity)
                    .save({})
                expect(inserted.id).to.be.eql(50)
            }),
        )
    })

    it("has the first inserted value with id 120 if change autoIncrementStartFrom to 10000", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                const exampleMetadata = dataSource.getMetadata(ExampleEntity)
                exampleMetadata.autoIncrementStartFrom = 10000

                await dataSource.synchronize()

                const inserted = await dataSource
                    .getRepository(ExampleEntity)
                    .save({})
                console.log(inserted.id)
                expect(inserted.id).to.be.eql(10000)

                await queryRunner.release()
            }),
        )
    })
})
