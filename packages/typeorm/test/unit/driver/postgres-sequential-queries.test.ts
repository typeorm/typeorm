import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import { DataSource } from "../../../src/data-source/DataSource"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableCheck } from "../../../src/schema-builder/table/TableCheck"
import { TableExclusion } from "../../../src/schema-builder/table/TableExclusion"
import { TableIndex } from "../../../src/schema-builder/table/TableIndex"
import { View } from "../../../src/schema-builder/view/View"
import { RdbmsSchemaBuilder } from "../../../src/schema-builder/RdbmsSchemaBuilder"

describe("Postgres and CockroachDB > sequential queries on single runner", () => {
    afterEach(() => sinon.restore())

    const trackConcurrency = (
        queryRunner: any,
        handler?: (sql: string) => any,
    ) => {
        let inFlight = 0
        let maxInFlight = 0
        const stub = sinon
            .stub(queryRunner, "query")
            .callsFake(async (sql: string) => {
                inFlight++
                if (inFlight > maxInFlight) maxInFlight = inFlight
                await new Promise((resolve) => setImmediate(resolve))
                inFlight--
                return handler ? handler(sql) : []
            })
        return {
            stub,
            getMaxInFlight: () => maxInFlight,
            resetMax: () => {
                maxInFlight = 0
            },
        }
    }

    it("should run check and exclusion constraint batch operations sequentially on PostgresQueryRunner", async () => {
        const dataSource = new DataSource({ type: "postgres" })
        const queryRunner = dataSource.createQueryRunner()
        const tracker = trackConcurrency(queryRunner)
        const table = new Table({
            name: "items",
            columns: [
                { name: "id", type: "int", isPrimary: true },
                { name: "a", type: "int" },
                { name: "b", type: "int" },
                { name: "c", type: "int" },
            ],
        })
        const checks = [
            new TableCheck({ name: "chk_a", expression: `"a" > 0` }),
            new TableCheck({ name: "chk_b", expression: `"b" > 0` }),
            new TableCheck({ name: "chk_c", expression: `"c" > 0` }),
        ]
        const exclusions = [
            new TableExclusion({
                name: "excl_a",
                expression: `USING btree ("a" WITH =)`,
            }),
            new TableExclusion({
                name: "excl_b",
                expression: `USING btree ("b" WITH =)`,
            }),
            new TableExclusion({
                name: "excl_c",
                expression: `USING btree ("c" WITH =)`,
            }),
        ]

        await queryRunner.createCheckConstraints(table, checks)
        expect(tracker.getMaxInFlight()).to.equal(1)
        expect(table.checks).to.have.length(3)

        // Passing table.checks directly into create must not revisit appended entries.
        tracker.stub.resetHistory()
        await queryRunner.createCheckConstraints(table, table.checks)
        expect(tracker.stub.callCount).to.equal(3)

        // Passing table.checks directly verifies copying protects against in-place mutation.
        tracker.resetMax()
        await queryRunner.dropCheckConstraints(table, table.checks)
        expect(tracker.getMaxInFlight()).to.equal(1)
        expect(table.checks).to.have.length(0)

        tracker.resetMax()
        await queryRunner.createExclusionConstraints(table, exclusions)
        expect(tracker.getMaxInFlight()).to.equal(1)
        expect(table.exclusions).to.have.length(3)

        tracker.stub.resetHistory()
        await queryRunner.createExclusionConstraints(table, table.exclusions)
        expect(tracker.stub.callCount).to.equal(3)

        tracker.resetMax()
        await queryRunner.dropExclusionConstraints(table, table.exclusions)
        expect(tracker.getMaxInFlight()).to.equal(1)
        expect(table.exclusions).to.have.length(0)
    })

    it("should run check constraint batch operations sequentially on CockroachQueryRunner", async () => {
        const dataSource = new DataSource({
            type: "cockroachdb",
            timeTravelQueries: false,
        })
        const queryRunner = dataSource.createQueryRunner()
        const tracker = trackConcurrency(queryRunner)
        const table = new Table({
            name: "items",
            columns: [
                { name: "id", type: "int", isPrimary: true },
                { name: "a", type: "int" },
                { name: "b", type: "int" },
                { name: "c", type: "int" },
            ],
        })
        const checks = [
            new TableCheck({ name: "chk_a", expression: `"a" > 0` }),
            new TableCheck({ name: "chk_b", expression: `"b" > 0` }),
            new TableCheck({ name: "chk_c", expression: `"c" > 0` }),
        ]

        await queryRunner.createCheckConstraints(table, checks)
        expect(tracker.getMaxInFlight()).to.equal(1)
        expect(table.checks).to.have.length(3)

        tracker.stub.resetHistory()
        await queryRunner.createCheckConstraints(table, table.checks)
        expect(tracker.stub.callCount).to.equal(3)

        tracker.resetMax()
        await queryRunner.dropCheckConstraints(table, table.checks)
        expect(tracker.getMaxInFlight()).to.equal(1)
        expect(table.checks).to.have.length(0)
    })

    it("should load enum columns sequentially in PostgresQueryRunner.loadTables", async () => {
        const dataSource = new DataSource({ type: "postgres" })
        const queryRunner = dataSource.createQueryRunner()
        sinon.stub(queryRunner, "getCurrentDatabase").resolves("test")
        sinon.stub(queryRunner, "getCurrentSchema").resolves("public")

        const tracker = trackConcurrency(queryRunner, (sql: string) => {
            if (sql.includes(`"information_schema"."tables"`)) {
                return [{ table_schema: "public", table_name: "items" }]
            }
            if (sql.includes(`"information_schema"."columns"`)) {
                return ["e1", "e2", "e3"].map((col) => ({
                    table_schema: "public",
                    table_name: "items",
                    column_name: col,
                    data_type: "USER-DEFINED",
                    udt_name: `${col}_enum`,
                    regtype: `${col}_enum`,
                    format_type: `${col}_enum`,
                    is_nullable: "NO",
                    is_identity: "NO",
                }))
            }
            if (sql.includes("pg_enum")) {
                return [{ value: "a" }, { value: "b" }]
            }
            return []
        })

        const tables = await queryRunner.getTables(["items"])

        expect(tables).to.have.length(1)
        expect(tables[0].columns).to.have.length(3)
        expect(tracker.getMaxInFlight()).to.equal(1)
    })

    it("should drop old table and view indices sequentially in RdbmsSchemaBuilder.dropOldIndices", async () => {
        const dataSource = new DataSource({ type: "postgres" })
        const queryRunner = dataSource.createQueryRunner()
        let inFlight = 0
        let maxInFlight = 0
        const dropIndex = sinon
            .stub(queryRunner, "dropIndex")
            .callsFake(async (table: any, idx: any) => {
                inFlight++
                if (inFlight > maxInFlight) maxInFlight = inFlight
                await new Promise((resolve) => setImmediate(resolve))
                table.removeIndex(idx)
                inFlight--
            })
        const dropViewIndex = sinon
            .stub(queryRunner as any, "dropViewIndex")
            .callsFake(async (view: any, idx: any) => {
                inFlight++
                if (inFlight > maxInFlight) maxInFlight = inFlight
                await new Promise((resolve) => setImmediate(resolve))
                view.removeIndex(idx)
                inFlight--
            })

        const table = new Table({
            name: "items",
            indices: [
                new TableIndex({ name: "idx_1", columnNames: ["a"] }),
                new TableIndex({ name: "idx_2", columnNames: ["b"] }),
                new TableIndex({ name: "idx_3", columnNames: ["c"] }),
            ],
        })
        const view = new View({
            name: "items_view",
            expression: "SELECT 1",
        })
        view.indices = [
            new TableIndex({ name: "vidx_1", columnNames: ["a"] }),
            new TableIndex({ name: "vidx_2", columnNames: ["b"] }),
            new TableIndex({ name: "vidx_3", columnNames: ["c"] }),
        ]

        const builder = new RdbmsSchemaBuilder(dataSource) as any
        builder.queryRunner = queryRunner
        builder.tables = [table]
        builder.views = [view]
        builder.getTablePath = (target: any) => target.name
        sinon
            .stub(builder, "entityToSyncMetadatas")
            .get(() => [{ name: "items", indices: [], columns: [] }])
        sinon
            .stub(builder, "viewEntityToSyncMetadatas")
            .get(() => [{ name: "items_view", indices: [], columns: [] }])

        await builder.dropOldIndices()

        expect(dropIndex.callCount).to.equal(3)
        expect(dropViewIndex.callCount).to.equal(3)
        expect(maxInFlight).to.equal(1)
    })
})
