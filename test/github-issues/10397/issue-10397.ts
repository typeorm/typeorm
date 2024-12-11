import { DataSource, Not } from "../../../src"
import { closeTestingConnections, createTestingConnections } from "../../utils/test-utils"
import { TestEntity } from "./entity/test.entity"
import { expect } from "chai"

describe('github issues > #10397 ValueTransformer gets FindOperator as value instead of transforming its value', () => {
    let connections: DataSource[]

    before(async () =>
        (connections = await createTestingConnections({
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
            entities: [TestEntity],
        })),
    )

    after(() => closeTestingConnections(connections))

    it('should not throw an error from the transformer', async () =>
        Promise.all(
            connections.map(async (connection) => {
                const testRepository = connection.getRepository(TestEntity)
                await testRepository.save(testRepository.create({ pairs: [{ key: 'key', value: 'value' }] }))

                expect(() => testRepository.createQueryBuilder().where({ pairs: Not([]) }).getMany()).not.to.throw()
            })
        )
    )
})
