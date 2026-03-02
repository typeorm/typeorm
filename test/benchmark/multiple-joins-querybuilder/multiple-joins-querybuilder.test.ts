import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { One } from "./entity/One"

/**
 * This test attempts to benchmark the raw CPU usage/latency of the query builder's
 * SQL string generation. We intentionally don't migrate the database or perform
 * any actual queries.
 */
describe("benchmark > QueryBuilder > wide join", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                __dirname,
                enabledDrivers: ["postgres"],
            })),
    )
    after(() => closeTestingConnections(dataSources))

    it("testing query builder with join to 10 relations with 10 columns each", () => {
        for (let i = 1; i <= 10_000; i++) {
            dataSources.forEach((connection) =>
                connection.manager
                    .createQueryBuilder(One, "ones")
                    .setFindOptions({
                        where: { id: 1 },
                        relations: {
                            two: true,
                            three: true,
                            four: true,
                            five: true,
                            six: true,
                            seven: true,
                            eight: true,
                            nine: true,
                            ten: true,
                        },
                    })
                    .getQuery(),
            )
        }

        /**
         * On a M1 macbook air, 5 runs:
         * 1861ms
         * 1850ms
         * 1859ms
         * 1859ms
         * 1884ms
         */
    })
})
