import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("database schema > column length > sap", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["sap"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("all types should create with correct size", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(table!.findColumnByName("varchar")!.length).to.be.equal(
                    "50",
                )
                expect(table!.findColumnByName("nvarchar")!.length).to.be.equal(
                    "50",
                )
                expect(table!.findColumnByName("alphanum")!.length).to.be.equal(
                    "50",
                )
                expect(
                    table!.findColumnByName("shorttext")!.length,
                ).to.be.equal("50")
                expect(
                    table!.findColumnByName("varbinary")!.length,
                ).to.be.equal("50")
            }),
        ))

    it("all types should update their size", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const metadata = connection.getMetadata(Post)
                metadata.findColumnWithPropertyName("varchar")!.length = "100"
                metadata.findColumnWithPropertyName("nvarchar")!.length = "100"
                metadata.findColumnWithPropertyName("alphanum")!.length = "100"
                metadata.findColumnWithPropertyName("shorttext")!.length = "100"
                metadata.findColumnWithPropertyName("varbinary")!.length = "100"

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(table!.findColumnByName("varchar")!.length).to.be.equal(
                    "100",
                )
                expect(table!.findColumnByName("nvarchar")!.length).to.be.equal(
                    "100",
                )
                expect(table!.findColumnByName("alphanum")!.length).to.be.equal(
                    "100",
                )
                expect(
                    table!.findColumnByName("shorttext")!.length,
                ).to.be.equal("100")
                expect(
                    table!.findColumnByName("varbinary")!.length,
                ).to.be.equal("100")
            }),
        ))
})
