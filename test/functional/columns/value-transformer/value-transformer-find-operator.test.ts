import { Equal, FindOperator, Not } from "../../../../src"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import type { Pair } from "./entity/PairEntity"
import { PairTransformer, TestEntity } from "./entity/PairEntity"
import { expect } from "chai"
import { ApplyValueTransformers } from "../../../../src/util/ApplyValueTransformers"

describe("columns > value-transformer > find-operator", () => {
    let dataSources: DataSource[]

    beforeAll(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
            entities: [TestEntity],
        })
    })

    afterAll(() => closeTestingConnections(dataSources))

    it("should not throw an error from the transformer", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const testRepository = dataSource.getRepository(TestEntity)
                await testRepository.save(
                    testRepository.create({
                        pairs: [{ key: "key", value: "value" }],
                    }),
                )

                await testRepository
                    .createQueryBuilder()
                    .where({ pairs: Not([]) })
                    .getMany()
            }),
        ))

    it("should transform the FindOperator value", () => {
        const testTransformer = new PairTransformer()
        const testFindOperator = Equal<Pair[]>([{ key: "key", value: "value" }])

        const result: FindOperator<string[]> =
            ApplyValueTransformers.transformTo(
                testTransformer,
                testFindOperator,
            )

        expect(result).to.be.instanceof(FindOperator)
        expect(result).to.eql(testFindOperator)
        expect(result.value).to.eql(["key:value"])
    })
})
