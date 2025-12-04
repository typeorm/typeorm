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
import "reflect-metadata"

import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("database schema > column length > sap", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["sap"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("all types should create with correct size", () =>
        Promise.all(
            connections.map(async (connection) => {
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
            connections.map(async (connection) => {
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
