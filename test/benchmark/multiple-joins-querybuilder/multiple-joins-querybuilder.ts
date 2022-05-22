import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
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
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                __dirname,
                enabledDrivers: ["postgres"],
            })),
    )
    after(() => closeTestingConnections(connections))

    it("testing query builder with join to 10 relations with 10 columns each", () => {
        for (let i = 1; i <= 10_000; i++) {
            connections.map((connection) =>
                connection.manager
                    .createQueryBuilder(One, "ones")
                    .setFindOptions({
                        where: { id: 1 },
                        relations: [
                            "two",
                            "three",
                            "four",
                            "five",
                            "six",
                            "seven",
                            "eight",
                            "nine",
                            "ten",
                        ],
                    })
                    .getQuery(),
            )
        }

        /**
         * On a M1 macbook air, 5 runs:
         * 3501ms
         * 3574ms
         * 3575ms
         * 3563ms
         * 3567ms
         */
    })
})
