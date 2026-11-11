import "reflect-metadata"
import { expect } from "chai"
import { DataSource, EntitySchema } from "../../../src"

describe("SQL Server identity columns in MERGE", () => {
    let dataSource: DataSource

    before(async () => {
        dataSource = new DataSource({
            type: "mssql",
            host: "localhost",
            database: "test",
            entities: [
                new EntitySchema({
                    name: "Sample",
                    columns: {
                        id: {
                            type: Number,
                            primary: true,
                            generated: true,
                            name: "sample_id",
                        },
                        code: { type: String, unique: true },
                        value: { type: Number },
                    },
                }),
                new EntitySchema({
                    name: "Manual",
                    columns: {
                        id: { type: Number, primary: true },
                        code: { type: String, unique: true },
                        value: { type: Number },
                    },
                }),
            ],
        })
        await dataSource["buildMetadatas"]()
    })

    it("inserts the supplied identity with IDENTITY_INSERT enabled", () => {
        const sql = dataSource
            .createQueryBuilder()
            .insert()
            .into("Sample")
            .values({ id: 1, code: "k1", value: 2 })
            .orUpdate(["sample_id", "value"], ["code"])
            .disableEscaping()
            .getSql()
        expect(sql).to.contain("SET IDENTITY_INSERT sample ON;")
        expect(sql).to.contain(
            "INSERT(sample_id, code, value) VALUES (mergeIntoSource.sample_id, mergeIntoSource.code, mergeIntoSource.value)",
        )
        expect(sql).to.contain("SET IDENTITY_INSERT sample OFF")
        expect(sql).not.to.contain(
            "sample.sample_id = mergeIntoSource.sample_id",
        )
    })

    it("does not include identities in the skip-unchanged predicate", () => {
        const sql = dataSource
            .createQueryBuilder()
            .insert()
            .into("Sample")
            .values({ id: 1, code: "k1", value: 2 })
            .orUpdate(["sample_id", "value"], ["code"], {
                skipUpdateIfNoValuesChanged: true,
            })
            .disableEscaping()
            .getSql()
        expect(sql).not.to.contain("sample.sample_id !=")
        expect(sql).to.contain("sample.value != mergeIntoSource.value")
    })

    it("does not enable IDENTITY_INSERT when no identity is supplied", () => {
        const sql = dataSource
            .createQueryBuilder()
            .insert()
            .into("Sample")
            .values({ code: "k1", value: 2 })
            .orUpdate(["value"], ["code"])
            .disableEscaping()
            .getSql()
        expect(sql).not.to.contain("IDENTITY_INSERT")
        expect(sql).to.contain(
            "INSERT(code, value) VALUES (mergeIntoSource.code, mergeIntoSource.value)",
        )
    })

    it("generates separate MERGE statements for mixed identity values", () => {
        const sql = dataSource
            .createQueryBuilder()
            .insert()
            .into("Sample")
            .values([
                { id: 1, code: "explicit", value: 2 },
                { code: "generated", value: 3 },
            ])
            .orUpdate(["sample_id", "value"], ["code"])
            .disableEscaping()
            .getSql()

        expect(sql.match(/MERGE INTO sample/g)).to.have.length(2)
        expect(sql).to.contain("SET IDENTITY_INSERT sample ON;")
        expect(sql).to.contain(
            "INSERT(code, value) VALUES (mergeIntoSource.code, mergeIntoSource.value)",
        )
    })

    it("still updates primary columns that are not identities", () => {
        const sql = dataSource
            .createQueryBuilder()
            .insert()
            .into("Manual")
            .values({ id: 1, code: "k1", value: 2 })
            .orUpdate(["id", "value"], ["code"])
            .disableEscaping()
            .getSql()
        expect(sql).to.contain("manual.id = mergeIntoSource.id")
        expect(sql).not.to.contain("IDENTITY_INSERT")
    })
})
