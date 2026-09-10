import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import { AllGeneratedEntity } from "./entity/AllGeneratedEntity"
import { StoredGeneratedEntity } from "./entity/StoredGeneratedEntity"
import { VirtualGeneratedEntity } from "./entity/VirtualGeneratedEntity"

describe("github issues > #11509 generated expression columns should be non-writable by default", () => {
    describe("stored generated columns", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [StoredGeneratedEntity],
                schemaCreate: true,
                dropSchema: true,
                // The entity uses a numeric transformer to normalize
                // cockroachdb's `int8`-as-string return into JS numbers so
                // the same equality assertions hold across all drivers.
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
                // postgres and spanner only support STORED generated columns,
                // so they are omitted here. cockroachdb is included; the
                // entity uses a numeric transformer to normalize its
                // `int8`-as-string return.
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

    // Regression for the follow-up issue: when every column on an entity is
    // filtered out of `getInsertedColumns()` (e.g. an auto-increment primary
    // key on Postgres plus a `STORED` generated expression column), the
    // InsertQueryBuilder used to fall back to `Object.keys(valueSet)` and
    // emit non-insertable columns in the SQL. The fix must produce a
    // `DEFAULT VALUES` INSERT instead, and still let the DB compute the
    // generated value.
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
    })
})
