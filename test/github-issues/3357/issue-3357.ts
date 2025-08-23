import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { BugInitial } from "./entity/BugInitial"
import { BugUpdated } from "./entity/BugUpdated"

describe("github issues > #3357 (postgres) changing varchar length should ALTER, not DROP/ADD", () => {
    let dataSourceInit!: DataSource
    let dataSourceNext!: DataSource

    before(async () => {
        // Create the initial schema in the DB (varchar(50))
        const conns = await createTestingConnections({
            entities: [BugInitial],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: false, // keep schema for diffing
        })

        dataSourceInit = conns[0]

        if (!dataSourceInit.isInitialized) {
            await dataSourceInit.initialize()
        }
        await dataSourceInit.synchronize()

        // Put real data in the table so it's not empty
        await dataSourceInit.query(
            `INSERT INTO "bug" ("example") VALUES ('hello')`,
        )

        // Now connect to the SAME DB but with updated metadata (varchar(51))
        const baseOpts = dataSourceInit.options
        dataSourceNext = new DataSource({
            ...(baseOpts as any),
            synchronize: false, // we only want to compute the SQL diff
            entities: [BugUpdated],
        } as any)

        await dataSourceNext.initialize()
    })

    after(async () => {
        if (dataSourceNext?.isInitialized) await dataSourceNext.destroy()

        if (dataSourceInit?.isInitialized) {
            try {
                await dataSourceInit.dropDatabase() // cleanup so test is repeatable
            } catch {
                /* ignore */
            }
            await closeTestingConnections([dataSourceInit])
        }
    })

    it("DESIRED: should use ALTER COLUMN TYPE character varying(51) (no DROP/ADD)", async () => {
        const sqlInMemory = await dataSourceNext.driver
            .createSchemaBuilder()
            .log()
        const upSql = sqlInMemory.upQueries.map((q) => q.query).join("\n")

        // Helpful for debugging
        console.log(
            "\n--- generated SQL ---\n" + upSql + "\n---------------------\n",
        )

        // Expect ALTER TYPE and forbid DROP/ADD
        expect(upSql).to.match(
            /ALTER TABLE .* ALTER COLUMN .* TYPE .*character varying\(51\)/i,
        )
        expect(upSql).to.not.match(/DROP COLUMN/i)
        expect(upSql).to.not.match(/\bADD\b/i)
    })
})
