import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../src/data-source/DataSource"
import { EntitySchema } from "../../src/entity-schema/EntitySchema"
import type { ColumnType } from "../../src/driver/types/ColumnTypes"
import { MssqlParameter } from "../../src/driver/sqlserver/MssqlParameter"

class MetadataOnlyDataSource extends DataSource {
    prepareMetadata(): Promise<void> {
        return this.buildMetadatas()
    }
}

describe("Query builders > spatial dialect types", () => {
    const cases: {
        engine: "postgres" | "mssql" | "mysql" | "aurora-mysql"
        logical: ColumnType
        physical?: string
        writeExpression?: string
        selection?: string
        cast?: string
        legacy?: boolean
    }[] = [
        {
            engine: "postgres",
            logical: "geometry",
            physical: "geography",
            writeExpression: "ST_SetSRID(ST_GeomFromGeoJSON",
            selection: "ST_AsGeoJSON",
            cast: "::geography",
        },
        {
            engine: "postgres",
            logical: "json",
            physical: "geometry",
            writeExpression: "ST_SetSRID(ST_GeomFromGeoJSON",
            selection: "ST_AsGeoJSON",
            cast: "::geometry",
        },
        { engine: "postgres", logical: "geometry", physical: "jsonb" },
        {
            engine: "postgres",
            logical: "geometry",
            writeExpression: "ST_SetSRID(ST_GeomFromGeoJSON",
            selection: "ST_AsGeoJSON",
            cast: "::geometry",
        },
        {
            engine: "mssql",
            logical: "geometry",
            physical: "geography",
            writeExpression: "geography::STGeomFromText",
            selection: ".ToString()",
        },
        {
            engine: "mssql",
            logical: "varchar",
            physical: "geography",
            writeExpression: "geography::STGeomFromText",
            selection: ".ToString()",
        },
        { engine: "mssql", logical: "geometry", physical: "varchar" },
        {
            engine: "mssql",
            logical: "geometry",
            writeExpression: "geometry::STGeomFromText",
            selection: ".ToString()",
        },
        {
            engine: "mysql",
            logical: "varchar",
            physical: "point",
            writeExpression: "ST_GeomFromText",
            selection: "ST_AsText",
        },
        { engine: "mysql", logical: "geometry", physical: "varchar" },
        {
            engine: "mysql",
            logical: "point",
            writeExpression: "GeomFromText",
            selection: "AsText",
            legacy: true,
        },
        {
            engine: "aurora-mysql",
            logical: "varchar",
            physical: "point",
            writeExpression: "ST_GeomFromText",
            selection: "ST_AsText",
        },
        {
            engine: "aurora-mysql",
            logical: "varchar",
            physical: "point",
            writeExpression: "GeomFromText",
            selection: "AsText",
            legacy: true,
        },
    ]

    for (const testCase of cases) {
        it(
            "uses physical spatial expressions for " +
                testCase.engine +
                " " +
                String(testCase.logical) +
                " to " +
                (testCase.physical ?? "default") +
                (testCase.legacy ? " (legacy)" : ""),
            async () => {
                const entity = new EntitySchema({
                    name: "SpatialValue",
                    columns: {
                        id: { type: Number, primary: true },
                        value: {
                            type: testCase.logical,
                            srid: 4326,
                            dialectTypes: testCase.physical
                                ? { [testCase.engine]: testCase.physical }
                                : undefined,
                        },
                    },
                })
                const dataSource =
                    testCase.engine === "aurora-mysql"
                        ? new MetadataOnlyDataSource({
                              type: "aurora-mysql",
                              database: "test",
                              region: "test",
                              secretArn: "test",
                              resourceArn: "test",
                              driver: class {},
                              formatOptions: { castParameters: false },
                              legacySpatialSupport: testCase.legacy,
                              entities: [entity],
                          })
                        : new MetadataOnlyDataSource({
                              type: testCase.engine,
                              database: "test",
                              driver: {},
                              legacySpatialSupport: testCase.legacy,
                              entities: [entity],
                          })
                await dataSource.prepareMetadata()
                const value =
                    testCase.engine === "postgres"
                        ? { type: "Point", coordinates: [12, 34] }
                        : "POINT(12 34)"
                const queries = [
                    dataSource
                        .createQueryBuilder()
                        .insert()
                        .into(entity)
                        .values({ id: 1, value }),
                    dataSource
                        .createQueryBuilder()
                        .update(entity)
                        .set({ value })
                        .where("id = 1"),
                ]
                for (const query of queries) {
                    const sql = query.getQuery()
                    const parameters = Object.values(query.getParameters())
                    if (testCase.writeExpression) {
                        expect(sql).to.contain(testCase.writeExpression)
                    } else {
                        expect(sql).not.to.contain("GeomFrom")
                    }
                    if (testCase.cast) expect(sql).to.contain(testCase.cast)
                    expect(
                        parameters.map((parameter) =>
                            parameter instanceof MssqlParameter
                                ? parameter.value
                                : parameter,
                        ),
                    ).to.include(
                        testCase.engine === "postgres"
                            ? JSON.stringify(value)
                            : value,
                    )
                }
                const select = dataSource
                    .getRepository(entity)
                    .createQueryBuilder("value")
                    .getQuery()
                if (testCase.selection) {
                    expect(select).to.contain(testCase.selection)
                } else {
                    expect(select).not.to.contain("ST_AsGeoJSON")
                    expect(select).not.to.contain("AsText")
                    expect(select).not.to.contain(".ToString()")
                }
                const column = dataSource
                    .getMetadata(entity)
                    .findColumnWithPropertyName("value")!
                expect(column.type).to.equal(testCase.logical)
                expect(column.srid).to.equal(4326)
                expect(column.dialectTypes?.[testCase.engine]).to.equal(
                    testCase.physical,
                )
            },
        )
    }
})
