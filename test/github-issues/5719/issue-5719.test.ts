import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { TestEntity, TestTransformer } from "./entity/TestEntity"
import { expect } from "chai"

describe("github issues > #5719 default value on entity trigger transformer twice", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [TestEntity],
                schemaCreate: true,
                dropSchema: true,
                // The problem occurs in databases which do NOT support RETURNING statement
                // and require a SELECT to reload entity after INSERT
                enabledDrivers: ["mysql"],
            })),
    )

    beforeEach(async () => {
        TestTransformer.reset()
        await reloadTestingDatabases(connections)
    })

    after(async () => await closeTestingConnections(connections))

    it("should use default value and apply transformer correctly when column is not set", async () => {
        for (const connection of connections) {
            const repository = connection.getRepository(TestEntity)

            // Create entity without setting the default column
            const entity = new TestEntity()
            entity.columnWithTransformerOnly = 200

            await repository.save(entity)

            // Load and verify default value is correctly transformed
            const loadedEntity = await repository.findOneBy({
                id: entity.id,
            })

            // default: 101, after to(): 102 in DB, after from(): 101
            expect(loadedEntity!.columnWithDefaultAndTransformer).to.equal(100)
            expect(loadedEntity!.columnWithTransformerOnly).to.equal(200)
        }
    })

    it("should preserve values correctly after update", async () => {
        for (const connection of connections) {
            const repository = connection.getRepository(TestEntity)

            // Create and save initial entity
            const entity = new TestEntity()
            entity.columnWithDefaultAndTransformer = 300
            entity.columnWithTransformerOnly = 400
            await repository.save(entity)

            // Update values
            entity.columnWithDefaultAndTransformer = 500
            entity.columnWithTransformerOnly = 600
            await repository.save(entity)

            // Verify updated values are preserved
            expect(entity.columnWithDefaultAndTransformer).to.equal(500)
            expect(entity.columnWithTransformerOnly).to.equal(600)
        }
    })

    it("should call transformer's from() method only once for columns with default value", async () => {
        for (const connection of connections) {
            const repository = connection.getRepository(TestEntity)

            // Create entity with explicit values for both columns
            const entity = new TestEntity()
            entity.columnWithDefaultAndTransformer = 300
            entity.columnWithTransformerOnly = 400

            TestTransformer.reset()
            await repository.save(entity)

            // Verify from() is called only once for the default column
            // (not twice due to double transformation bug)
            // Only columnWithDefaultAndTransformer triggers SELECT reload
            expect(TestTransformer.fromCallCount).to.equal(1)
        }
    })
})
