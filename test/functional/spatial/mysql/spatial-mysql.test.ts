import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { DriverUtils } from "../../../../src/driver/DriverUtils"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { LetterBox } from "./entity/LetterBox"

describe("spatial > mysql", () => {
    describe("when legacySpatialSupport: true", () => {
        let dataSources: DataSource[]

        beforeAll(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mysql"],
                dropSchema: true,
                schemaCreate: true,
                driverSpecific: {
                    legacySpatialSupport: true,
                },
            })
        })
        afterAll(() => closeTestingConnections(dataSources))

        it("should use GeomFromText", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (
                        DriverUtils.isReleaseVersionOrGreater(
                            dataSource.driver,
                            "8.0",
                        )
                    ) {
                        return
                    }

                    const queryBuilder = dataSource
                        .createQueryBuilder()
                        .insert()
                    queryBuilder
                        .into(LetterBox)
                        .values({ coord: "POINT(20 30)" })
                    const sql = queryBuilder.getSql()

                    expect(sql).includes("GeomFromText")
                    expect(sql).not.includes("ST_GeomFromText")

                    await queryBuilder.execute()
                }),
            ))

        it("should provide SRID", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (
                        DriverUtils.isReleaseVersionOrGreater(
                            dataSource.driver,
                            "8.0",
                        )
                    ) {
                        return
                    }

                    const queryBuilder = dataSource
                        .createQueryBuilder()
                        .insert()
                    queryBuilder
                        .into(LetterBox)
                        .values({ coord: "POINT(25 100)" })
                    const sql = queryBuilder.getSql()

                    expect(sql).includes("4326")

                    await queryBuilder.execute()
                }),
            ))

        it("should use AsText", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (
                        DriverUtils.isReleaseVersionOrGreater(
                            dataSource.driver,
                            "8.0",
                        )
                    ) {
                        return
                    }

                    const repository = dataSource.getRepository(LetterBox)
                    const queryBuilder = repository
                        .createQueryBuilder("letterBox")
                        .select(["letterBox"])
                    const sql = queryBuilder.getSql()

                    expect(sql).includes("AsText")
                    expect(sql).not.includes("ST_AsText")

                    await queryBuilder.getMany()
                }),
            ))
    })

    describe("when legacySpatialSupport: false", () => {
        let dataSources: DataSource[]

        beforeAll(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mysql"],
                dropSchema: true,
                schemaCreate: true,
                driverSpecific: {
                    legacySpatialSupport: false,
                },
            })
        })
        afterAll(() => closeTestingConnections(dataSources))

        it("should use ST_GeomFromText", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryBuilder = dataSource
                        .createQueryBuilder()
                        .insert()
                    queryBuilder
                        .into(LetterBox)
                        .values({ coord: "POINT(20 30)" })
                    const sql = queryBuilder.getSql()

                    expect(sql).includes("ST_GeomFromText")

                    await queryBuilder.execute()
                }),
            ))

        it("should provide SRID", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryBuilder = dataSource
                        .createQueryBuilder()
                        .insert()
                    queryBuilder
                        .into(LetterBox)
                        .values({ coord: "POINT(25 100)" })
                    const sql = queryBuilder.getSql()

                    expect(sql).includes("4326")

                    await queryBuilder.execute()
                }),
            ))

        it("should use ST_AsText", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(LetterBox)
                    const queryBuilder = repository
                        .createQueryBuilder("letterBox")
                        .select(["letterBox"])
                    const sql = queryBuilder.getSql()

                    expect(sql).includes("ST_AsText")

                    await queryBuilder.getMany()
                }),
            ))
    })
})
