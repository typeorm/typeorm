import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { TestEntity } from "./entity/test.entity"

describe("github issues > #7760 Mongodb: When field is null in db, typeorm query sets it to undefined", () => {
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

    it("should delete all documents related to search pattern", () =>
        Promise.all(
            connections.map(async (connection) => {
                const testEntityRepository =
                    connection.getRepository(TestEntity)

                // save few documents
                const firstEntity = new TestEntity()
                firstEntity.name = "First"
                firstEntity.testId = "1"
                await testEntityRepository.save(firstEntity)

                const secondEntity = new TestEntity()
                secondEntity.name = "Second"
                secondEntity.testId = null
                await testEntityRepository.save(secondEntity)

                const thirdEntity = new TestEntity()
                thirdEntity.name = "Third"
                thirdEntity.testId = "3"
                await testEntityRepository.save(thirdEntity)

                const fourthEntity = new TestEntity()
                fourthEntity.name = "Fourth"
                fourthEntity.testId = null
                await testEntityRepository.save(fourthEntity)

                const loadedEntities = await testEntityRepository.find()

                expect(loadedEntities.length).to.be.eql(4)

                expect(loadedEntities[0]).to.be.instanceOf(TestEntity)
                expect(loadedEntities[0]!.name).to.be.equal(firstEntity.name)
                expect(loadedEntities[0]!.testId).to.be.eql("1")

                expect(loadedEntities[1]).to.be.instanceOf(TestEntity)
                expect(loadedEntities[1]!.name).to.be.equal(secondEntity.name)
                expect(loadedEntities[1]!.testId).to.be.eql(null)

                expect(loadedEntities[2]).to.be.instanceOf(TestEntity)
                expect(loadedEntities[2]!.name).to.be.equal(thirdEntity.name)
                expect(loadedEntities[2]!.testId).to.be.eql("3")

                expect(loadedEntities[3]).to.be.instanceOf(TestEntity)
                expect(loadedEntities[3]!.name).to.be.equal(fourthEntity.name)
                expect(loadedEntities[3]!.testId).to.be.eql(null)
            }),
        ))
})
