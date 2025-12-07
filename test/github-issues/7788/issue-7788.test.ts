import "reflect-metadata"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { TestEntity } from "./entity/test.entity"

describe("github issues > #7788 MongoDB update make changes only to first matched document", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mongodb"],
            entities: [TestEntity],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should update all documents related to search pattern", () =>
        Promise.all(
            connections.map(async (connection) => {
                const testEntityRepository =
                    connection.getMongoRepository(TestEntity)

                // save few posts
                const firstEntity = new TestEntity()
                firstEntity.id = "1"
                firstEntity.name = "Test"
                await testEntityRepository.save(firstEntity)

                const secondEntity = new TestEntity()
                secondEntity.id = "2"
                secondEntity.name = "Test"
                await testEntityRepository.save(secondEntity)

                const thirdEntity = new TestEntity()
                thirdEntity.id = "3"
                thirdEntity.name = "Original"
                await testEntityRepository.save(thirdEntity)

                const fourthEntity = new TestEntity()
                fourthEntity.id = "4"
                fourthEntity.name = "Test"
                await testEntityRepository.save(fourthEntity)

                await testEntityRepository.update(
                    { name: "Test" },
                    { name: "Updated" },
                )

                const loadedEntities = await testEntityRepository.find()

                expect(loadedEntities[0]).to.be.instanceOf(TestEntity)
                expect(loadedEntities[0]!.id).to.be.eql(firstEntity.id)
                expect(loadedEntities[0]!.name).to.be.equal("Updated")

                expect(loadedEntities[1]).to.be.instanceOf(TestEntity)
                expect(loadedEntities[1]!.id).to.be.eql(secondEntity.id)
                expect(loadedEntities[1]!.name).to.be.equal("Updated")

                expect(loadedEntities[2]).to.be.instanceOf(TestEntity)
                expect(loadedEntities[2]!.id).to.be.eql(thirdEntity.id)
                expect(loadedEntities[2]!.name).to.be.equal("Original")

                expect(loadedEntities[3]).to.be.instanceOf(TestEntity)
                expect(loadedEntities[3]!.id).to.be.eql(fourthEntity.id)
                expect(loadedEntities[3]!.name).to.be.equal("Updated")
            }),
        ))
})
