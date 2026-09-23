import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { EntitySchema } from "../../../../src/entity-schema/EntitySchema"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"

type SpatialValue = {
    id: number
    location: object | string
    fromText: object | string
    storedValue: object | string
}

// Regression coverage for https://github.com/typeorm/typeorm/issues/12874.
describe("columns > dialect types > spatial writes", () => {
    const contexts: {
        dataSource: DataSource
        entity: EntitySchema<SpatialValue>
    }[] = []

    before(async () => {
        for (const engine of ["postgres", "mssql", "mysql"] as const) {
            const entity = new EntitySchema<SpatialValue>({
                name: "SpatialOverrideValue",
                tableName: "dialect_spatial_value",
                columns: {
                    id: { type: Number, primary: true },
                    location: {
                        type: "geometry",
                        spatialFeatureType: "Point",
                        srid: 4326,
                        dialectTypes: {
                            postgres: "geography",
                            mssql: "geography",
                            mysql: "point",
                        },
                    },
                    fromText: {
                        type: engine === "postgres" ? "json" : "varchar",
                        spatialFeatureType: "Point",
                        srid: 4326,
                        dialectTypes: {
                            postgres: "geometry",
                            mssql: "geography",
                            mysql: "point",
                        },
                    },
                    storedValue: {
                        type: "geometry",
                        dialectTypes: {
                            postgres: "jsonb",
                            mssql: "varchar(128)",
                            mysql: "varchar(128)",
                        },
                    },
                },
            })
            const connections = await createTestingConnections({
                entities: [entity],
                enabledDrivers: [engine],
                schemaCreate: true,
                dropSchema: true,
            })
            contexts.push(
                ...connections.map((dataSource) => ({ dataSource, entity })),
            )
        }
    })
    after(() =>
        closeTestingConnections(contexts.map(({ dataSource }) => dataSource)),
    )

    it("should create the physical column types without changing logical metadata", async () => {
        await Promise.all(
            contexts.map(async ({ dataSource, entity }) => {
                const engine = dataSource.options.type
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable(
                    "dialect_spatial_value",
                )
                await queryRunner.release()
                const expectedLocation =
                    engine === "mysql" ? "point" : "geography"
                expect(table!.findColumnByName("location")!.type).to.equal(
                    expectedLocation,
                )
                expect(table!.findColumnByName("fromText")!.type).to.equal(
                    engine === "postgres" ? "geometry" : expectedLocation,
                )
                expect(table!.findColumnByName("storedValue")!.type).to.equal(
                    engine === "postgres" ? "jsonb" : "varchar",
                )
                const metadata = dataSource.getMetadata(entity)
                expect(
                    metadata.findColumnWithPropertyName("location")!.type,
                ).to.equal("geometry")
                expect(
                    metadata.findColumnWithPropertyName("fromText")!.type,
                ).to.equal(engine === "postgres" ? "json" : "varchar")
                expect(
                    metadata.findColumnWithPropertyName("storedValue")!.type,
                ).to.equal("geometry")
            }),
        )
    })

    it("should insert, update and read values through their physical types", async () => {
        await Promise.all(
            contexts.map(async ({ dataSource, entity }) => {
                const repository = dataSource.getRepository(entity)
                const postgres = dataSource.options.type === "postgres"
                const original = postgres
                    ? { type: "Point", coordinates: [12, 34] }
                    : "POINT(12 34)"
                const changed = postgres
                    ? { type: "Point", coordinates: [45, 56] }
                    : "POINT(45 56)"
                await repository.insert({
                    id: 1,
                    location: original,
                    fromText: original,
                    storedValue: original,
                })
                const first = await repository.findOneByOrFail({ id: 1 })
                if (postgres) {
                    expect(first.location).to.deep.equal(original)
                    expect(first.fromText).to.deep.equal(original)
                    expect(first.storedValue).to.deep.equal(original)
                } else {
                    for (const value of [
                        first.location,
                        first.fromText,
                        first.storedValue,
                    ]) {
                        expect(String(value)).to.match(
                            /POINT\s*\(\s*12\s+34\s*\)/i,
                        )
                    }
                }

                await repository.update(1, {
                    location: changed,
                    fromText: changed,
                    storedValue: changed,
                })
                const updated = await repository.findOneByOrFail({ id: 1 })
                if (postgres) {
                    expect(updated.location).to.deep.equal(changed)
                    expect(updated.fromText).to.deep.equal(changed)
                    expect(updated.storedValue).to.deep.equal(changed)
                } else {
                    for (const value of [
                        updated.location,
                        updated.fromText,
                        updated.storedValue,
                    ]) {
                        expect(String(value)).to.match(
                            /POINT\s*\(\s*45\s+56\s*\)/i,
                        )
                    }
                }
            }),
        )
    })

    it("should produce no schema changes on the next synchronization", async () => {
        await Promise.all(
            contexts.map(async ({ dataSource }) => {
                const queries = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(queries.upQueries).to.be.empty
                expect(queries.downQueries).to.be.empty
            }),
        )
    })
})
