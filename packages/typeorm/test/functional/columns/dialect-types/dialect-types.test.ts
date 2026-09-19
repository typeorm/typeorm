import "reflect-metadata"

import { expect } from "chai"

import { type DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("columns > dialect types", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres", "mysql", "mariadb", "better-sqlite3"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create the column with the type declared for the current driver", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                const payload = table!.findColumnByName("payload")!
                const level = table!.findColumnByName("level")!

                switch (dataSource.driver.options.type) {
                    case "postgres":
                        expect(payload.type).to.equal("jsonb")
                        expect(level.type).to.equal("smallint")
                        break
                    case "mysql":
                    case "mariadb":
                        expect(payload.type).to.equal("json")
                        expect(level.type).to.equal("tinyint")
                        break
                    case "better-sqlite3":
                        expect(payload.type).to.equal("json")
                        expect(level.type).to.equal("tinyint")
                        break
                }
            }),
        )
    })

    it("should not report changed columns on a second synchronization", async () => {
        // the physical type differs from the logical one on the overriding
        // driver, but the comparison must use the same resolved type for
        // creation and detection, otherwise synchronize never settles
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const before = await queryRunner.getTables()
                await dataSource.synchronize(false)
                const after = await queryRunner.getTables()
                await queryRunner.release()

                expect(after).to.be.deep.equal(before)
            }),
        )
    })
})
