import { expect } from "chai"
import { ArrayEmbedding } from "./entity/ArrayEmbedding"
import { DriverUtils } from "../../../../../src/driver/DriverUtils"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../../utils/test-utils"
import { DataSource, DeepPartial } from "../../../../../src"
import { FvecsEmbedding } from "./entity/FvecsEmbedding"

describe("database-schema > vector columns > sap", () => {
    describe("real_vector with output type Array", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [ArrayEmbedding],
                enabledDrivers: ["sap"],
                driverSpecific: {
                    extra: {
                        vectorOutputType: "Array",
                    },
                },
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should work correctly - create, persist and hydrate", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (
                        !DriverUtils.isReleaseVersionOrGreater(
                            dataSource.driver,
                            "4.0",
                        )
                    ) {
                        return
                    }

                    await dataSource.synchronize()

                    // Verify column metadata
                    const queryRunner = await dataSource.createQueryRunner()
                    const table = (await queryRunner.getTable(
                        dataSource.getMetadata(ArrayEmbedding).tableName,
                    ))!
                    await queryRunner.release()

                    expect(table.findColumnByName("smallVector")).to.contain({
                        type: "real_vector",
                        length: "16",
                    })
                    expect(table.findColumnByName("largeVector")).to.contain({
                        type: "real_vector",
                        length: "1536",
                        isNullable: true,
                    })
                    expect(table.findColumnByName("variableVector")).to.contain(
                        {
                            type: "real_vector",
                            length: "",
                        },
                    )

                    const plainEmbedding = {
                        id: 1,
                        content:
                            "This is a sample text to be analyzed by SAP Joule AI",
                        metadata: `{"client":"typeorm"}`,
                        smallVector: [
                            0.004318627528846264, -0.008295782841742039,
                            0.011462775990366936, -0.03171011060476303,
                            -0.003404685528948903, 0.018827877938747406,
                            0.010692788287997246, 0.014154385775327682,
                            -0.026206370443105698, -0.03977154940366745,
                            -0.008630559779703617, 0.040039367973804474,
                            0.0019048830727115273, 0.01347813569009304,
                            -0.02147931419312954, -0.004211498890072107,
                        ],
                        largeVector: null,
                        variableVector: [
                            -0.0015692687593400478, -0.013364311307668686,
                            0.013545091263949871, 0.034843627363443375,
                            0.02682236023247242, -0.011710511520504951,
                            0.0019400346791371703, -0.003324338933452964,
                            0.004094745498150587, -0.01127530075609684,
                            -0.020943669602274895, -0.018211888149380684,
                            -0.00585190812125802, 0.01311657577753067,
                            -0.011121302843093872, 0.003078277688473463,
                        ],
                    } satisfies DeepPartial<ArrayEmbedding>

                    const embeddingRepository =
                        dataSource.getRepository(ArrayEmbedding)
                    const embedding = embeddingRepository.create(plainEmbedding)
                    await embeddingRepository.save(embedding)

                    const loadedEmbedding = await embeddingRepository.findOneBy(
                        { id: 1 },
                    )
                    expect(loadedEmbedding).to.deep.equal(plainEmbedding)
                }),
            ))
    })

    describe("real_vector with output type Buffer", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [FvecsEmbedding],
                enabledDrivers: ["sap"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        function deserializeFvecs(buffer: Buffer) {
            const dataView = new DataView(
                buffer.buffer,
                buffer.byteOffset,
                buffer.byteLength,
            )
            const length = dataView.getUint32(0, true)
            const array = new Array<number>(length)
            for (let index = 0; index < length; index++) {
                array[index] = dataView.getFloat32(4 + index * 4, true)
            }

            return array
        }

        function serializeFvecs(array: number[]) {
            const length = array.length
            const arrayBuffer = new ArrayBuffer(4 + length * 4)
            const dataView = new DataView(arrayBuffer)

            dataView.setUint32(0, length, true)
            for (let index = 0; index < length; index++) {
                dataView.setFloat32(4 + index * 4, array[index], true)
            }

            return Buffer.from(arrayBuffer)
        }

        it("should work correctly - persist and hydrate ", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (
                        !DriverUtils.isReleaseVersionOrGreater(
                            dataSource.driver,
                            "4.0",
                        )
                    ) {
                        return
                    }

                    await dataSource.synchronize()

                    const plainVector = [
                        -0.0015692687593400478, -0.013364311307668686,
                        0.013545091263949871, 0.034843627363443375,
                        0.02682236023247242, -0.011710511520504951,
                        0.0019400346791371703, -0.003324338933452964,
                        0.004094745498150587, -0.01127530075609684,
                        -0.020943669602274895, -0.018211888149380684,
                        -0.00585190812125802, 0.01311657577753067,
                        -0.011121302843093872, 0.003078277688473463,
                    ]

                    const plainEmbedding = {
                        id: 1,
                        content:
                            "This is a sample text to be analyzed by SAP Joule AI",
                        metadata: `{"client":"typeorm"}`,
                        vector: serializeFvecs(plainVector),
                    } satisfies DeepPartial<FvecsEmbedding>

                    const embeddingRepository =
                        dataSource.getRepository(FvecsEmbedding)
                    const embedding = embeddingRepository.create(plainEmbedding)
                    await embeddingRepository.save(embedding)

                    const loadedEmbedding = await embeddingRepository.findOneBy(
                        { id: 1 },
                    )
                    const loadedVector = deserializeFvecs(
                        loadedEmbedding!.vector,
                    )
                    expect(loadedVector).to.deep.equal(plainVector)
                }),
            ))
    })
})
