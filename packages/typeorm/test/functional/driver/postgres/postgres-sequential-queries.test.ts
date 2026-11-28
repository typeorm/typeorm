import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { Table } from "../../../../src/schema-builder/table/Table"
import { TableCheck } from "../../../../src/schema-builder/table/TableCheck"
import { TableExclusion } from "../../../../src/schema-builder/table/TableExclusion"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

describe("driver > postgres > sequential batch queries", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            cache: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not execute concurrent queries on the same pg client for constraints, enums, or cache removals", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const client = await queryRunner.connect()
                let inFlight = 0
                let maxInFlight = 0
                const origQuery = client.query.bind(client)
                client.query = (...args: any[]) => {
                    inFlight++
                    if (inFlight > maxInFlight) maxInFlight = inFlight
                    const result = origQuery(...args)
                    if (result && typeof result.finally === "function") {
                        return result.finally(() => {
                            inFlight--
                        })
                    }
                    inFlight--
                    return result
                }

                try {
                    await queryRunner.createTable(
                        new Table({
                            name: "pg_seq_test",
                            columns: [
                                { name: "id", type: "int", isPrimary: true },
                                { name: "a", type: "int" },
                                { name: "b", type: "int" },
                                { name: "c", type: "int" },
                            ],
                        }),
                        true,
                    )

                    const checks = [
                        new TableCheck({
                            name: "chk_seq_a",
                            expression: `"a" > 0`,
                        }),
                        new TableCheck({
                            name: "chk_seq_b",
                            expression: `"b" > 0`,
                        }),
                        new TableCheck({
                            name: "chk_seq_c",
                            expression: `"c" > 0`,
                        }),
                    ]
                    const exclusions = [
                        new TableExclusion({
                            name: "excl_seq_a",
                            expression: `USING btree ("a" WITH =)`,
                        }),
                        new TableExclusion({
                            name: "excl_seq_b",
                            expression: `USING btree ("b" WITH =)`,
                        }),
                        new TableExclusion({
                            name: "excl_seq_c",
                            expression: `USING btree ("c" WITH =)`,
                        }),
                    ]

                    maxInFlight = 0
                    await queryRunner.createCheckConstraints(
                        "pg_seq_test",
                        checks,
                    )
                    expect(maxInFlight).to.equal(1)

                    maxInFlight = 0
                    await queryRunner.dropCheckConstraints(
                        "pg_seq_test",
                        checks,
                    )
                    expect(maxInFlight).to.equal(1)

                    maxInFlight = 0
                    await queryRunner.createExclusionConstraints(
                        "pg_seq_test",
                        exclusions,
                    )
                    expect(maxInFlight).to.equal(1)

                    maxInFlight = 0
                    await queryRunner.dropExclusionConstraints(
                        "pg_seq_test",
                        exclusions,
                    )
                    expect(maxInFlight).to.equal(1)

                    await queryRunner.query(
                        `DROP TABLE IF EXISTS "pg_seq_enums" CASCADE`,
                    )
                    await queryRunner.query(
                        `DROP TYPE IF EXISTS "pg_seq_enum_1", "pg_seq_enum_2", "pg_seq_enum_3"`,
                    )
                    await queryRunner.query(
                        `CREATE TYPE "pg_seq_enum_1" AS ENUM ('a', 'b')`,
                    )
                    await queryRunner.query(
                        `CREATE TYPE "pg_seq_enum_2" AS ENUM ('c', 'd')`,
                    )
                    await queryRunner.query(
                        `CREATE TYPE "pg_seq_enum_3" AS ENUM ('e', 'f')`,
                    )
                    await queryRunner.query(
                        `CREATE TABLE "pg_seq_enums" ("id" int primary key, "e1" "pg_seq_enum_1", "e2" "pg_seq_enum_2", "e3" "pg_seq_enum_3")`,
                    )

                    maxInFlight = 0
                    const tables = await queryRunner.getTables(["pg_seq_enums"])
                    expect(tables).to.have.length(1)
                    expect(maxInFlight).to.equal(1)

                    maxInFlight = 0
                    await dataSource.queryResultCache!.remove(
                        ["k1", "k2", "k3"],
                        queryRunner,
                    )
                    expect(maxInFlight).to.equal(1)
                } finally {
                    client.query = origQuery
                    await queryRunner.query(
                        `DROP TABLE IF EXISTS "pg_seq_test", "pg_seq_enums" CASCADE`,
                    )
                    await queryRunner.query(
                        `DROP TYPE IF EXISTS "pg_seq_enum_1", "pg_seq_enum_2", "pg_seq_enum_3"`,
                    )
                    await queryRunner.release()
                }
            }),
        ))
})
