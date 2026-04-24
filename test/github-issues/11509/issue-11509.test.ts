import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import { StoredGeneratedEntity } from "./entity/StoredGeneratedEntity"
import { VirtualGeneratedEntity } from "./entity/VirtualGeneratedEntity"

describe("github issues > #11509 generated expression columns should be non-writable by default", () => {
    describe("stored generated columns", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [StoredGeneratedEntity],
                enabledDrivers: ["postgres", "mysql", "aurora-postgres"],
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
                enabledDrivers: ["mysql", "mariadb", "aurora-mysql"],
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
})
