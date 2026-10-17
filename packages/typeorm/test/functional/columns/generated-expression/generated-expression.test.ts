import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { TypeORMError } from "../../../../src/error/TypeORMError"
import { AllGeneratedEntity } from "./entity/AllGeneratedEntity"
import { StoredGeneratedEntity } from "./entity/StoredGeneratedEntity"
import { VirtualGeneratedEntity } from "./entity/VirtualGeneratedEntity"

// https://github.com/typeorm/typeorm/issues/11509
describe("columns > generated-expression", () => {
    describe("stored generated columns", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [StoredGeneratedEntity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: [
                    "postgres",
                    "mysql",
                    "mariadb",
                    "mssql",
                    "cockroachdb",
                    "better-sqlite3",
                    "sqljs",
                ],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should ignore manually assigned stored generated value on insert", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    const entity = new StoredGeneratedEntity()
                    entity.id = 101
                    entity.name = "insert-name"
                    entity.generated = 99999

                    await connection.manager.save(entity)

                    const reloaded = await connection.manager.findOneByOrFail(
                        StoredGeneratedEntity,
                        { id: entity.id },
                    )

                    expect(reloaded.name).to.equal("insert-name")
                    expect(reloaded.generated).to.equal(entity.id * 2)
                }),
            ))

        it("should ignore manually assigned stored generated value on update", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    const entity = new StoredGeneratedEntity()
                    entity.id = 102
                    entity.name = "before-update"

                    await connection.manager.save(entity)

                    entity.name = "after-update"
                    entity.generated = 123456

                    await connection.manager.save(entity)

                    const reloaded = await connection.manager.findOneByOrFail(
                        StoredGeneratedEntity,
                        { id: entity.id },
                    )

                    expect(reloaded.name).to.equal("after-update")
                    expect(reloaded.generated).to.equal(entity.id * 2)
                }),
            ))
    })

    describe("virtual generated columns", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [VirtualGeneratedEntity],
                schemaCreate: true,
                dropSchema: true,
                // postgres and spanner support only STORED
                enabledDrivers: [
                    "mysql",
                    "mariadb",
                    "mssql",
                    "cockroachdb",
                    "better-sqlite3",
                    "sqljs",
                ],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should ignore manually assigned virtual generated value on insert", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    const entity = new VirtualGeneratedEntity()
                    entity.id = 201
                    entity.name = "insert-name"
                    entity.generated = 99999

                    await connection.manager.save(entity)

                    const reloaded = await connection.manager.findOneByOrFail(
                        VirtualGeneratedEntity,
                        { id: entity.id },
                    )

                    expect(reloaded.name).to.equal("insert-name")
                    expect(reloaded.generated).to.equal(entity.id * 3)
                }),
            ))

        it("should ignore manually assigned virtual generated value on update", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    const entity = new VirtualGeneratedEntity()
                    entity.id = 202
                    entity.name = "before-update"

                    await connection.manager.save(entity)

                    entity.name = "after-update"
                    entity.generated = 123456

                    await connection.manager.save(entity)

                    const reloaded = await connection.manager.findOneByOrFail(
                        VirtualGeneratedEntity,
                        { id: entity.id },
                    )

                    expect(reloaded.name).to.equal("after-update")
                    expect(reloaded.generated).to.equal(entity.id * 3)
                }),
            ))
    })

    describe("query builder with only non-insertable columns", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [AllGeneratedEntity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should not leak non-insertable columns into generated INSERT SQL", () => {
            dataSources.forEach((connection) => {
                const qb = connection
                    .createQueryBuilder()
                    .insert()
                    .into(AllGeneratedEntity)
                    .values({ generated: 99999 })

                const [sql] = qb.getQueryAndParameters()

                expect(sql).to.not.include('"generated"')
                expect(sql).to.include("DEFAULT VALUES")
            })
        })

        it("should insert successfully and compute generated value from the DB", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    const result = await connection
                        .createQueryBuilder()
                        .insert()
                        .into(AllGeneratedEntity)
                        .values({ generated: 99999 })
                        .returning(["id"])
                        .execute()

                    const insertedId = result.identifiers[0].id as number
                    expect(insertedId).to.be.a("number")

                    const reloaded = await connection.manager.findOneByOrFail(
                        AllGeneratedEntity,
                        { id: insertedId },
                    )

                    expect(reloaded.generated).to.equal(2)
                }),
            ))

        it("should reject multi-row insert with only default values", () => {
            dataSources.forEach((connection) => {
                const qb = connection
                    .createQueryBuilder()
                    .insert()
                    .into(AllGeneratedEntity)
                    .values([{ generated: 1 }, { generated: 2 }])

                expect(() => qb.getQueryAndParameters()).to.throw(
                    TypeORMError,
                    "no insertable columns",
                )
            })
        })

        it("should save multiple entities with only non-insertable values", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    const entities = [1, 2].map((generated) =>
                        connection.manager.create(AllGeneratedEntity, {
                            generated,
                        }),
                    )

                    await connection.manager.save(entities)

                    expect(
                        await connection.manager.count(AllGeneratedEntity),
                    ).to.equal(2)
                    expect(entities[0].id).to.not.equal(entities[1].id)
                }),
            ))
    })
})
