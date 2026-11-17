import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { BigintEntity } from "./entity/BigintEntity"

// Regression for https://github.com/typeorm/typeorm/issues/9813.
describe("query builder > MySQL generated bigint IDs", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            __dirname,
            enabledDrivers: ["mysql", "mariadb"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(async () => {
        await reloadTestingDatabases(dataSources)
        await Promise.all(
            dataSources.map((dataSource) =>
                dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(BigintEntity)
                    .values({ id: "9007199254740992", label: "seed" })
                    // Seed AUTO_INCREMENT without using generated ID mapping.
                    .updateEntity(false)
                    .execute(),
            ),
        )
    })
    after(() => closeTestingConnections(dataSources))

    it("should return the exact generated ID after saving one entity", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(BigintEntity)
                const entity = repository.create({ label: "single" })
                await repository.save(entity)

                expect(entity.id).to.equal("9007199254740993")
                expect(
                    await repository.findOneByOrFail({ id: entity.id }),
                ).to.deep.equal(entity)
            }),
        ))

    it("should return exact consecutive IDs after inserting multiple entities", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(BigintEntity)
                const entities = repository.create([
                    { label: "first" },
                    { label: "second" },
                ])
                const result = await repository.insert(entities)
                const expected = [
                    { id: "9007199254740993" },
                    { id: "9007199254740994" },
                ]

                expect(result.identifiers).to.deep.equal(expected)
                expect(result.generatedMaps).to.deep.equal(expected)
                expect(entities.map(({ id }) => ({ id }))).to.deep.equal(
                    expected,
                )
                expect(
                    await repository.find({ order: { id: "ASC" } }),
                ).to.deep.equal([
                    { id: "9007199254740992", label: "seed" },
                    { id: "9007199254740993", label: "first" },
                    { id: "9007199254740994", label: "second" },
                ])
            }),
        ))
})
