import "reflect-metadata"
import { expect } from "chai"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("database schema > column length > mysql", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["mysql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("all types should be created with correct length", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(table!.findColumnByName("char")!.length).to.be.equal(
                    "50",
                )
                expect(table!.findColumnByName("varchar")!.length).to.be.equal(
                    "50",
                )
            }),
        ))

    it("all types should update their length", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const metadata = connection.getMetadata(Post)
                metadata.findColumnWithPropertyName("char")!.length = "100"
                metadata.findColumnWithPropertyName("varchar")!.length = "100"

                await connection.synchronize(false)

                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(table!.findColumnByName("char")!.length).to.be.equal(
                    "100",
                )
                expect(table!.findColumnByName("varchar")!.length).to.be.equal(
                    "100",
                )
            }),
        ))
})
