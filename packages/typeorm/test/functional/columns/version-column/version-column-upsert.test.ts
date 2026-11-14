import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Human } from "./entity/Human"
import { ProtectedHuman } from "./entity/ProtectedHuman"

describe("columns > version column > upsert", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [Human, ProtectedHuman],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // Regression coverage for #12924.
    it("should update the version automatically on upsert", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                for (const upsertType of connection.driver
                    .supportedUpsertTypes) {
                    const humanRepo = connection.getRepository(Human)
                    const human = humanRepo.create({
                        name: `John Doe - ${upsertType}`,
                        email: `john-${upsertType}@email.com`,
                    })
                    await humanRepo.save(human)

                    human.name = `John Doe - ${upsertType} - Updated Name`
                    let conflictPaths = ["email"]
                    if (upsertType === "primary-key") {
                        conflictPaths = ["id"]
                        human.email = `john-different-${upsertType}@email.com`
                    }

                    await humanRepo.upsert(human, {
                        upsertType,
                        conflictPaths,
                    })
                    let loadedHuman = await humanRepo.findOneByOrFail({
                        id: human.id,
                    })
                    expect(loadedHuman.version).to.be.eql(2)

                    await humanRepo.upsert(human, {
                        upsertType,
                        conflictPaths,
                    })
                    loadedHuman = await humanRepo.findOneByOrFail({
                        id: human.id,
                    })
                    expect(loadedHuman.version).to.be.eql(3)
                }
            }),
        ))

    it("should not update a protected version column", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                for (const upsertType of connection.driver
                    .supportedUpsertTypes) {
                    const repository = connection.getRepository(ProtectedHuman)
                    const human = repository.create({
                        name: `Jane Doe - ${upsertType}`,
                        email: `jane-${upsertType}@email.com`,
                    })
                    await repository.save(human)

                    human.name = `Jane Doe - ${upsertType} - Updated`
                    await repository.upsert(human, {
                        upsertType,
                        conflictPaths:
                            upsertType === "primary-key" ? ["id"] : ["email"],
                    })

                    const loaded = await repository.findOneByOrFail({
                        id: human.id,
                    })
                    expect(loaded.name).to.equal(human.name)
                    expect(loaded.version).to.equal(1)
                }
            }),
        ))
})
