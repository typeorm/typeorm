import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("query runner > load tables sequentially", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb"],
            entities: [__dirname + "/load-tables-sequential/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    // Avoid concurrent queries on the same pg client; see #12238.
    it("should not run concurrent queries on one client when loading tables with enum and array columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()

                const originalQuery = queryRunner.query.bind(queryRunner)
                let inFlight = 0
                let maxInFlight = 0
                queryRunner.query = (async (
                    ...args: Parameters<typeof originalQuery>
                ) => {
                    inFlight++
                    maxInFlight = Math.max(maxInFlight, inFlight)
                    try {
                        return await originalQuery(...args)
                    } finally {
                        inFlight--
                    }
                }) as typeof queryRunner.query

                const tables = await queryRunner.getTables([
                    "account",
                    "invoice",
                ])

                expect(tables.map((table) => table.name).sort()).to.deep.equal([
                    "account",
                    "invoice",
                ])
                expect(maxInFlight).to.equal(1)
            }),
        ))
})
