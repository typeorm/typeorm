import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Sample } from "./entity/Sample"

describe("github issues > #12962 SQL Server upsert with an identity value", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Sample],
            enabledDrivers: ["mssql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("updates a loaded entity using a different conflict column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Sample)
                await repository.insert({ code: "k1", value: 1 })
                const sample = await repository.findOneByOrFail({ code: "k1" })
                const id = sample.id
                sample.value = 2
                await repository.upsert(sample, ["code"])
                expect(
                    await repository.findOneByOrFail({ code: "k1" }),
                ).to.deep.equal({ id, code: "k1", value: 2 })
            }),
        ))

    it("preserves the matched row's identity when a different id is supplied", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Sample)
                const sample = await repository.save({ code: "k1", value: 1 })
                await repository.upsert({ id: 100, code: "k1", value: 2 }, [
                    "code",
                ])
                expect(
                    await repository.findOneByOrFail({ code: "k1" }),
                ).to.deep.equal({ id: sample.id, code: "k1", value: 2 })
            }),
        ))

    it("inserts supplied identities while updating existing rows in the same batch", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Sample)
                const sample = await repository.save({ code: "k1", value: 1 })
                await repository.upsert(
                    [
                        { id: sample.id, code: "k1", value: 2 },
                        { id: 100, code: "k2", value: 3 },
                    ],
                    ["code"],
                )
                expect(
                    await repository.find({ order: { code: "ASC" } }),
                ).to.deep.equal([
                    { id: sample.id, code: "k1", value: 2 },
                    { id: 100, code: "k2", value: 3 },
                ])
                await repository.insert({ code: "k3", value: 4 })
                expect(
                    (await repository.findOneByOrFail({ code: "k3" })).id,
                ).to.be.greaterThan(100)
            }),
        ))

    it("generates identities when they are omitted", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Sample)
                await repository.upsert({ code: "k1", value: 1 }, ["code"])
                const sample = await repository.findOneByOrFail({ code: "k1" })
                await repository.upsert({ code: "k1", value: 2 }, ["code"])
                expect(
                    await repository.findOneByOrFail({ code: "k1" }),
                ).to.deep.equal({ id: sample.id, code: "k1", value: 2 })
            }),
        ))

    it("supports the identity itself as the conflict path", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Sample)
                await repository.upsert({ id: 100, code: "k1", value: 1 }, [
                    "id",
                ])
                await repository.upsert({ id: 100, code: "k1", value: 2 }, [
                    "id",
                ])
                expect(
                    await repository.findOneByOrFail({ id: 100 }),
                ).to.deep.equal({ id: 100, code: "k1", value: 2 })
            }),
        ))

    it("does not treat a different identity as a changed value", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Sample)
                const sample = await repository.save({ code: "k1", value: 1 })
                const result = await repository.upsert(
                    { id: 100, code: "k1", value: 1 },
                    {
                        conflictPaths: ["code"],
                        skipUpdateIfNoValuesChanged: true,
                    },
                )
                expect(result.raw).to.have.length(0)
                expect(
                    await repository.findOneByOrFail({ code: "k1" }),
                ).to.deep.equal(sample)
            }),
        ))

    it("omits identity-only updates", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Sample)
                const sample = await repository.save({ code: "k1", value: 1 })
                await repository.upsert({ id: 100, code: "k1" }, ["code"])
                expect(
                    await repository.findOneByOrFail({ code: "k1" }),
                ).to.deep.equal(sample)
            }),
        ))
})
