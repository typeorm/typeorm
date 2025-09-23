import "reflect-metadata"
import { expect } from "chai"
import { DataSource, Table } from "../../../../src"

describe("alter-varchar-length (postgres)", function () {
    this.timeout(60000)

    const ds = new DataSource({
        type: "postgres",
        host: process.env.PGHOST || "localhost",
        port: +(process.env.PGPORT || 5432),
        username: process.env.PGUSER || "test",
        password: process.env.PGPASSWORD || "test",
        database: process.env.PGDATABASE || "test",
        logging: false,
    })

    before(async () => {
        await ds.initialize()
        const qr = ds.createQueryRunner()
        try {
            await qr.query(`DROP TABLE IF EXISTS "varchar_widen_test"`)
            await qr.createTable(
                new Table({
                    name: "varchar_widen_test",
                    columns: [
                        {
                            name: "id",
                            type: "integer",
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: "increment",
                        },
                        {
                            name: "name",
                            type: "varchar",
                            length: "50",
                            isNullable: false,
                        },
                    ],
                }),
            )
            await qr.query(
                `INSERT INTO "varchar_widen_test" ("name") VALUES ($1)`,
                ["x".repeat(50)],
            )
        } finally {
            await qr.release()
        }
    })

    after(async () => {
        const qr = ds.createQueryRunner()
        try {
            await qr.query(`DROP TABLE IF EXISTS "varchar_widen_test"`)
        } finally {
            await qr.release()
            await ds.destroy()
        }
    })

    it("widen varchar(50)->varchar(51) using changeColumn; should use ALTER TYPE and keep data", async () => {
        const qr = ds.createQueryRunner()

        const seen: string[] = []
        const origQuery = (qr as any).query.bind(qr)
        ;(qr as any).query = async (sql: string, params?: any[]) => {
            seen.push(sql)
            return origQuery(sql, params)
        }

        try {
            const table = await qr.getTable("varchar_widen_test")
            const oldCol = table!.findColumnByName("name")!
            const newCol = oldCol.clone()
            newCol.length = "51"

            await qr.changeColumn(table!, oldCol, newCol)

            const rows = await qr.query(
                `SELECT LENGTH("name") AS len FROM "varchar_widen_test"`,
            )
            expect(rows[0].len).to.equal(50)

            const text = seen.join("\n").toLowerCase()
            expect(text).to.match(
                /alter table .* alter column "name" type .*varying\(51\)/,
            )
            expect(text).to.not.match(/drop column "name"/)
            expect(text).to.not.match(/add column "name"/)
        } finally {
            await qr.release()
        }
    })
})
