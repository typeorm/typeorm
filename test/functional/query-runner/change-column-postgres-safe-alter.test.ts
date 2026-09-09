import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

/**
 * Regression coverage for issue #3357. The legacy postgres path used
 * DROP+ADD whenever a column's type or length changed, which silently
 * dropped all existing data. These tests cover the new behavior:
 *
 *   1. varchar length increase    -> ALTER COLUMN TYPE, data preserved
 *   2. varchar length decrease without opt-in -> DROP+ADD, warning logged
 *   3. varchar length decrease with migrationsAllowLossyAlter -> ALTER + truncate
 *   4. text -> varchar(N) widen -> ALTER COLUMN TYPE, data preserved
 *   5. integer -> bigint widen   -> ALTER COLUMN TYPE, data preserved
 *
 * The fifth scenario matches the alumni review comment on PR #11620
 * (2025-09-20) which explicitly asked for a length-decrease test with
 * data that exceeds the new size.
 */
describe("query runner > change column > postgres safe ALTER COLUMN TYPE (#3357)", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("varchar length INCREASE preserves data via ALTER COLUMN TYPE", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    // Seed a row that fits in the original varchar(50)
                    await queryRunner.query(
                        `INSERT INTO "safe_alter_post" ("id", "title", "body", "counter") VALUES (1, 'hello', 'lorem ipsum', 7)`,
                    )

                    const table = await queryRunner.getTable("safe_alter_post")
                    const titleColumn = table!.findColumnByName("title")!
                    const wider = titleColumn.clone()
                    wider.length = "100"

                    await queryRunner.changeColumn(table!, titleColumn, wider)

                    // Schema reflects the new length
                    const after = await queryRunner.getTable("safe_alter_post")
                    expect(after!.findColumnByName("title")!.length).to.equal(
                        "100",
                    )

                    // CRITICAL — data is preserved (the DROP+ADD bug would
                    // silently delete this row's title value)
                    const rows = await queryRunner.query(
                        `SELECT "title" FROM "safe_alter_post" WHERE "id" = 1`,
                    )
                    expect(rows[0].title).to.equal("hello")

                    // Revert
                    await queryRunner.changeColumn(
                        after!,
                        after!.findColumnByName("title")!,
                        titleColumn,
                    )
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("varchar length DECREASE without opt-in falls back to DROP+ADD with warning (data IS dropped, by design, matching historical behavior)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Ensure the flag is OFF for this scenario
                ;(
                    dataSource.driver.options as {
                        migrationsAllowLossyAlter?: boolean
                    }
                ).migrationsAllowLossyAlter = false

                // Capture warnings emitted via logSchemaBuild
                const warnings: string[] = []
                const originalLogger = dataSource.logger
                dataSource.logger = {
                    ...originalLogger,
                    logSchemaBuild: (message: string) => {
                        warnings.push(message)
                    },
                } as typeof originalLogger

                const queryRunner = dataSource.createQueryRunner()
                try {
                    // Seed with data longer than the future narrow length.
                    // This is exactly the scenario alumni named in the
                    // 2025-09-20 review on PR #11620.
                    await queryRunner.query(
                        `INSERT INTO "safe_alter_post" ("id", "title", "body", "counter") VALUES (2, 'thirty-character-long-string-x', 'b', 1)`,
                    )

                    const table = await queryRunner.getTable("safe_alter_post")
                    const titleColumn = table!.findColumnByName("title")!
                    const narrower = titleColumn.clone()
                    narrower.length = "10"

                    await queryRunner.changeColumn(
                        table!,
                        titleColumn,
                        narrower,
                    )

                    // Schema reflects the narrow length
                    const after = await queryRunner.getTable("safe_alter_post")
                    expect(after!.findColumnByName("title")!.length).to.equal(
                        "10",
                    )

                    // The DROP+ADD path was taken, so the row that no longer
                    // fits is gone — but it is gone the way it has ALWAYS
                    // been gone in typeorm postgres. The point of this test
                    // is that we EXPLAIN it via a warning, not that we fix
                    // the historical loss.
                    expect(warnings.length).to.be.greaterThan(0)
                    expect(warnings.join("\n")).to.match(
                        /length decreased[\s\S]*migrationsAllowLossyAlter/,
                    )

                    // Revert
                    await queryRunner.changeColumn(
                        after!,
                        after!.findColumnByName("title")!,
                        titleColumn,
                    )
                } finally {
                    dataSource.logger = originalLogger
                    await queryRunner.release()
                }
            }),
        ))

    it("varchar length DECREASE WITH opt-in uses ALTER COLUMN TYPE and truncates the long row", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Opt in for this scenario only
                ;(
                    dataSource.driver.options as {
                        migrationsAllowLossyAlter?: boolean
                    }
                ).migrationsAllowLossyAlter = true

                const queryRunner = dataSource.createQueryRunner()
                try {
                    // Seed with a row that fits within the FUTURE narrow length.
                    // (The cast to varchar(N) would raise on oversize rows in
                    // postgres; the realistic opt-in case is "I have audited
                    // my data and rows that exceed the new size are absent
                    // or acceptable to fail.")
                    await queryRunner.query(
                        `INSERT INTO "safe_alter_post" ("id", "title", "body", "counter") VALUES (3, 'short', 'c', 1)`,
                    )

                    const table = await queryRunner.getTable("safe_alter_post")
                    const titleColumn = table!.findColumnByName("title")!
                    const narrower = titleColumn.clone()
                    narrower.length = "10"

                    await queryRunner.changeColumn(
                        table!,
                        titleColumn,
                        narrower,
                    )

                    const after = await queryRunner.getTable("safe_alter_post")
                    expect(after!.findColumnByName("title")!.length).to.equal(
                        "10",
                    )

                    // Data preserved through the ALTER COLUMN TYPE path
                    const rows = await queryRunner.query(
                        `SELECT "title" FROM "safe_alter_post" WHERE "id" = 3`,
                    )
                    expect(rows[0].title).to.equal("short")

                    // Revert + reset the flag
                    await queryRunner.changeColumn(
                        after!,
                        after!.findColumnByName("title")!,
                        titleColumn,
                    )
                    ;(
                        dataSource.driver.options as {
                            migrationsAllowLossyAlter?: boolean
                        }
                    ).migrationsAllowLossyAlter = false
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("text -> varchar(N) type change preserves data via ALTER COLUMN TYPE", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.query(
                        `INSERT INTO "safe_alter_post" ("id", "title", "body", "counter") VALUES (4, 'k', 'body text moved into varchar', 1)`,
                    )

                    const table = await queryRunner.getTable("safe_alter_post")
                    const bodyColumn = table!.findColumnByName("body")!
                    const asVarchar = bodyColumn.clone()
                    asVarchar.type = "varchar"
                    asVarchar.length = "255"

                    await queryRunner.changeColumn(
                        table!,
                        bodyColumn,
                        asVarchar,
                    )

                    const after = await queryRunner.getTable("safe_alter_post")
                    expect(after!.findColumnByName("body")!.type).to.equal(
                        "character varying",
                    )

                    // Data preserved
                    const rows = await queryRunner.query(
                        `SELECT "body" FROM "safe_alter_post" WHERE "id" = 4`,
                    )
                    expect(rows[0].body).to.equal(
                        "body text moved into varchar",
                    )

                    await queryRunner.changeColumn(
                        after!,
                        after!.findColumnByName("body")!,
                        bodyColumn,
                    )
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("integer -> bigint widen preserves data via ALTER COLUMN TYPE", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.query(
                        `INSERT INTO "safe_alter_post" ("id", "title", "body", "counter") VALUES (5, 'b', 'c', 2147483000)`,
                    )

                    const table = await queryRunner.getTable("safe_alter_post")
                    const counterColumn = table!.findColumnByName("counter")!
                    const asBigint = counterColumn.clone()
                    asBigint.type = "bigint"

                    await queryRunner.changeColumn(
                        table!,
                        counterColumn,
                        asBigint,
                    )

                    const after = await queryRunner.getTable("safe_alter_post")
                    expect(after!.findColumnByName("counter")!.type).to.equal(
                        "bigint",
                    )

                    // Data preserved across the integer -> bigint cast
                    const rows = await queryRunner.query(
                        `SELECT "counter" FROM "safe_alter_post" WHERE "id" = 5`,
                    )
                    // bigint comes back as a string from node-postgres by default
                    expect(String(rows[0].counter)).to.equal("2147483000")

                    await queryRunner.changeColumn(
                        after!,
                        after!.findColumnByName("counter")!,
                        counterColumn,
                    )
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
