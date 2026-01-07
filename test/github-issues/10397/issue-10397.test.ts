import { DataSource, Equal, FindOperator, Not } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Pair, PairTransformer, TestEntity } from "./entity/test.entity"
import { expect } from "chai"
import { ApplyValueTransformers } from "../../../src/util/ApplyValueTransformers"

describe("github issues > #10397 ValueTransformer gets FindOperator as value instead of transforming its value", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres"],
                schemaCreate: true,
                dropSchema: true,
                entities: [TestEntity],
            })),
    )

    after(() => closeTestingConnections(connections))

    it("should not throw an error from the transformer", async () =>
        Promise.all(
            connections.map(async (connection) => {
                const testRepository = connection.getRepository(TestEntity)
                await testRepository.save(
                    testRepository.create({
                        pairs: [{ key: "key", value: "value" }],
                    }),
                )

                expect(() =>
                    testRepository
                        .createQueryBuilder()
                        .where({ pairs: Not([]) })
                        .getMany(),
                ).not.to.throw()
            }),
        ))

    it("should transform the FindOperator value", async () => {
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
