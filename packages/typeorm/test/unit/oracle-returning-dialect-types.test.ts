import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../src/data-source/DataSource"
import type { ColumnType } from "../../src/driver/types/ColumnTypes"
import { EntitySchema } from "../../src/entity-schema/EntitySchema"

class MetadataOnlyDataSource extends DataSource {
    prepareMetadata(): Promise<void> {
        return this.buildMetadatas()
    }
}

describe("OracleDriver > RETURNING dialect types", () => {
    // Only native binding constants are needed; no Oracle client or connection
    // is created while metadata and the real INSERT query are built.
    const oracle = {
        BIND_OUT: 3003,
        DB_TYPE_CLOB: 2017,
        DB_TYPE_BLOB: 2019,
        DB_TYPE_VARCHAR: 2001,
        DB_TYPE_NUMBER: 2010,
    }
    const cases: {
        name: string
        type: ColumnType
        override?: string
        value: string | number | Buffer
        nativeType: number
    }[] = [
        {
            name: "text overridden as clob",
            type: "text",
            override: "clob",
            value: "returned text",
            nativeType: oracle.DB_TYPE_CLOB,
        },
        {
            name: "bytea overridden as blob",
            type: "bytea",
            override: "blob",
            value: Buffer.from("returned bytes"),
            nativeType: oracle.DB_TYPE_BLOB,
        },
        {
            name: "varchar without an override",
            type: "varchar",
            value: "returned text",
            nativeType: oracle.DB_TYPE_VARCHAR,
        },
        {
            name: "Number without an override",
            type: Number,
            value: 42,
            nativeType: oracle.DB_TYPE_NUMBER,
        },
    ]

    for (const testCase of cases) {
        it(`binds RETURNING for ${testCase.name} without changing logical metadata`, async () => {
            const entity = new EntitySchema({
                name: "OracleReturningValue",
                columns: {
                    id: { type: Number, primary: true },
                    payload: {
                        type: testCase.type,
                        dialectTypes: testCase.override
                            ? { oracle: testCase.override }
                            : undefined,
                    },
                },
            })
            const dataSource = new MetadataOnlyDataSource({
                type: "oracle",
                driver: oracle,
                entities: [entity],
            })
            await dataSource.prepareMetadata()
            const column = dataSource
                .getMetadata(entity)
                .findColumnWithPropertyName("payload")!

            const [sql, parameters] = dataSource
                .createQueryBuilder()
                .insert()
                .into(entity)
                .values({ id: 1, payload: testCase.value })
                .returning(["payload"])
                .getQueryAndParameters()

            expect(sql).to.contain('RETURNING "payload" INTO')
            expect(
                parameters.filter(
                    (parameter) => parameter?.dir === oracle.BIND_OUT,
                ),
            ).to.deep.equal([
                { type: testCase.nativeType, dir: oracle.BIND_OUT },
            ])
            expect(column.type).to.equal(testCase.type)
            expect(column.dialectTypes?.oracle).to.equal(testCase.override)
            expect(dataSource.isInitialized).to.equal(false)
        })
    }
})
