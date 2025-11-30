import { expect } from "chai"
import { DataSource, DeepPartial } from "../../../../../src"
import { DriverUtils } from "../../../../../src/driver/DriverUtils"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../utils/test-utils"
import { Embedding } from "./entity/Embedding"

describe("database-schema > vectors > mysql", () => {
    describe("with vector output type Array", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Embedding],
                enabledDrivers: ["mariadb", "mysql"],
                driverSpecific: {
                    synchronize: false,
                },
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("should work correctly - create, persist and hydrate", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (
                        (dataSource.options.type === "mysql" &&
                            !DriverUtils.isReleaseVersionOrGreater(
                                dataSource.driver,
                                "9.0",
                            )) ||
                        (dataSource.options.type === "mariadb" &&
                            !DriverUtils.isReleaseVersionOrGreater(
                                dataSource.driver,
                                "11.7",
                            ))
                    ) {
                        return
                    }

                    await dataSource.synchronize()

                    // Verify column metadata
                    const queryRunner = dataSource.createQueryRunner()
                    const table = (await queryRunner.getTable(
                        dataSource.getMetadata(Embedding).tableName,
                    ))!
                    await queryRunner.release()

                    expect(table.findColumnByName("vector")).to.contain({
                        type: "vector",
                        length: "16",
                    })

                    const vector = [
                        0.004318627528846264, -0.008295782841742039,
                        0.011462775990366936, -0.03171011060476303,
                        -0.003404685528948903, 0.018827877938747406,
                        0.010692788287997246, 0.014154385775327682,
                        -0.026206370443105698, -0.03977154940366745,
                        -0.008630559779703617, 0.040039367973804474,
                        0.0019048830727115273, 0.01347813569009304,
                        -0.02147931419312954, -0.004211498890072107,
                    ]
                    const plainEmbedding = {
                        id: 1,
                        content: "This is a sample text to be analyzed by AI",
                        metadata: `{"client":"typeorm"}`,
                        vector,
                    } satisfies DeepPartial<Embedding>

                    const embeddingRepository =
                        dataSource.getRepository(Embedding)
                    const embedding = embeddingRepository.create(plainEmbedding)
                    await embeddingRepository.save(embedding)

                    const loadedEmbedding = await embeddingRepository.findOneBy(
                        { id: 1 },
                    )
                    expect(loadedEmbedding).to.deep.equal(plainEmbedding)
                }),
            ))
    })
})
