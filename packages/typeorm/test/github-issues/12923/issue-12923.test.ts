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
import { UserNonUpdatableVersion } from "./entity/UserNonUpdatableVersion"

describe("github issues > #12923 @VersionColumn is not auto-incremented during Repository.upsert() in PostgreSQL", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [User, UserCustomVersion, UserNonUpdatableVersion],
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
                .orUpdate([], ["external_id"])

            const sql = query.getSql()

            if (dataSource.driver.options.type === "postgres") {
                expect(sql).to.include("DO NOTHING")
                expect(sql).to.not.include('"version" = "version" + 1')
            }
        })
    })

    it("should not increment version column when update is false", () => {
        dataSources.forEach((dataSource) => {
            const repository = dataSource.getRepository(UserNonUpdatableVersion)

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
                expect(sql).to.include('"first_name" = EXCLUDED."first_name"')
                expect(sql).to.not.include('"version" = "version" + 1')
            }
        })
    })

    it("should auto-increment version column when upsert updates an existing record", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(User)

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
