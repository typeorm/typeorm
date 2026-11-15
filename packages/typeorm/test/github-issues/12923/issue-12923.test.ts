import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/User"
import { UserCustomVersion } from "./entity/UserCustomVersion"

describe("github issues > #12923 @VersionColumn is not auto-incremented during Repository.upsert() in PostgreSQL", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [User, UserCustomVersion],
            enabledDrivers: [
                "postgres",
                "aurora-postgres",
                "cockroachdb",
                "better-sqlite3",
                "sqljs",
            ],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should include version = version + 1 in DO UPDATE SET clause for postgres", () => {
        dataSources.forEach((dataSource) => {
            const repository = dataSource.getRepository(User)

            const query = repository
                .createQueryBuilder()
                .insert()
                .values({
                    externalId: "user_99",
                    firstName: "Alice",
                })
                .orUpdate(["first_name"], ["external_id"])

            const sql = query.getSql()

            if (dataSource.driver.options.type === "postgres") {
                expect(sql).to.include('"version" = "version" + 1')
                expect(sql).to.include('"first_name" = EXCLUDED."first_name"')
                expect(sql).to.include('"updatedAt" = DEFAULT')
            }
        })
    })

    it("should support custom version column name in DO UPDATE SET clause", () => {
        dataSources.forEach((dataSource) => {
            const repository = dataSource.getRepository(UserCustomVersion)

            const query = repository
                .createQueryBuilder()
                .insert()
                .values({
                    externalId: "user_99",
                    firstName: "Alice",
                })
                .orUpdate(["first_name"], ["external_id"])

            const sql = query.getSql()

            if (dataSource.driver.options.type === "postgres") {
                expect(sql).to.include('"v_count" = "v_count" + 1')
                expect(sql).to.include('"first_name" = EXCLUDED."first_name"')
                expect(sql).to.include('"updatedAt" = DEFAULT')
            }
        })
    })

    it("should not add version = version + 1 if version is explicitly included in overwrite", () => {
        dataSources.forEach((dataSource) => {
            const repository = dataSource.getRepository(User)

            const query = repository
                .createQueryBuilder()
                .insert()
                .values({
                    externalId: "user_99",
                    firstName: "Alice",
                })
                .orUpdate(["first_name", "version"], ["external_id"])

            const sql = query.getSql()

            if (dataSource.driver.options.type === "postgres") {
                expect(sql).to.include('"version" = EXCLUDED."version"')
                expect(sql).to.not.include('"version" = "version" + 1')
            }
        })
    })

    it("should not increment version or emit DO UPDATE if no non-conflict columns are provided in overwrite", () => {
        dataSources.forEach((dataSource) => {
            const repository = dataSource.getRepository(User)

            const query = repository
                .createQueryBuilder()
                .insert()
                .values({
                    externalId: "user_99",
                })
                .orUpdate(["external_id"], ["external_id"])

            const sql = query.getSql()

            if (dataSource.driver.options.type === "postgres") {
                expect(sql).to.include("DO NOTHING")
                expect(sql).to.not.include('"version" = "version" + 1')
            }
        })
    })

    it("should not emit WHEN MATCHED UPDATE clause in merge statement when no non-conflict columns are in overwrite", () => {
        dataSources.forEach((dataSource) => {
            const repository = dataSource.getRepository(User)
            const query = repository.createQueryBuilder().insert().values({
                externalId: "user_99",
            })

            const driver = dataSource.driver as unknown as {
                supportedUpsertTypes: string[]
                options: { type: string }
                parametrizeValue?: (column: unknown, value: unknown) => unknown
            }
            const originalSupportedUpsertTypes = driver.supportedUpsertTypes
            const originalDriverType = driver.options.type
            const originalParametrizeValue = driver.parametrizeValue
            try {
                driver.supportedUpsertTypes = ["merge-into"]
                driver.options.type = "mssql"
                driver.parametrizeValue = (
                    _col: unknown,
                    val: unknown,
                ): unknown => val

                query.orUpdate(["external_id"], ["external_id"])
                const sql = query.getSql()

                expect(sql).to.include("MERGE INTO")
                expect(sql).to.not.include("WHEN MATCHED")
                expect(sql).to.not.include(
                    '"User"."version" = "User"."version" + 1',
                )
            } finally {
                driver.supportedUpsertTypes = originalSupportedUpsertTypes
                driver.options.type = originalDriverType
                driver.parametrizeValue = originalParametrizeValue
            }
        })
    })

    it("should include version increment in WHEN MATCHED UPDATE clause in merge statement when non-conflict columns exist", () => {
        dataSources.forEach((dataSource) => {
            const repository = dataSource.getRepository(User)
            const query = repository.createQueryBuilder().insert().values({
                externalId: "user_99",
                firstName: "Alice",
            })

            const driver = dataSource.driver as unknown as {
                supportedUpsertTypes: string[]
                options: { type: string }
                parametrizeValue?: (column: unknown, value: unknown) => unknown
            }
            const originalSupportedUpsertTypes = driver.supportedUpsertTypes
            const originalDriverType = driver.options.type
            const originalParametrizeValue = driver.parametrizeValue
            try {
                driver.supportedUpsertTypes = ["merge-into"]
                driver.options.type = "mssql"
                driver.parametrizeValue = (
                    _col: unknown,
                    val: unknown,
                ): unknown => val

                query.orUpdate(["first_name"], ["external_id"])
                const sql = query.getSql()

                expect(sql).to.include("MERGE INTO")
                expect(sql).to.include("WHEN MATCHED")
                expect(sql).to.include(
                    '"User"."version" = "User"."version" + 1',
                )
            } finally {
                driver.supportedUpsertTypes = originalSupportedUpsertTypes
                driver.options.type = originalDriverType
                driver.parametrizeValue = originalParametrizeValue
            }
        })
    })

    it("should auto-increment version column when upsert updates an existing record", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(User)

                // 1. Initial insert
                await repository.upsert(
                    {
                        externalId: "user_99",
                        firstName: "Alice",
                    },
                    ["externalId"],
                )

                let record = await repository.findOneBy({
                    externalId: "user_99",
                })

                expect(record).to.not.be.null
                expect(record!.firstName).to.equal("Alice")
                expect(record!.version).to.equal(1)

                // 2. Upsert update (conflict on externalId)
                await repository.upsert(
                    {
                        externalId: "user_99",
                        firstName: "Bob",
                    },
                    ["externalId"],
                )

                record = await repository.findOneBy({
                    externalId: "user_99",
                })

                expect(record).to.not.be.null
                expect(record!.firstName).to.equal("Bob")
                expect(record!.version).to.equal(2)

                // 3. Subsequent upsert update
                await repository.upsert(
                    {
                        externalId: "user_99",
                        firstName: "Charlie",
                    },
                    ["externalId"],
                )

                record = await repository.findOneBy({
                    externalId: "user_99",
                })

                expect(record).to.not.be.null
                expect(record!.firstName).to.equal("Charlie")
                expect(record!.version).to.equal(3)
            }),
        ))
})
