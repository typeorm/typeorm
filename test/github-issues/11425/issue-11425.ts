import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { bufferSet } from "./entity/bufferSet"
import { expect } from "chai"
import { DataSource } from "../../../src"

describe("github issues > #11425 Add support for TypedArray in FindOptionsSelect", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should load TypedArray fields when selected with FindOptionsSelect", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const bufferSetRepository = connection.getRepository(bufferSet)

                const testBuffer = Buffer.from("test buffer data")
                const testUint8Array = new Uint8Array([1, 2, 3, 4, 5])

                const entity = new bufferSet()
                entity.BufferData = testBuffer
                entity.Uint8ArrayData = testUint8Array

                await bufferSetRepository.save(entity)

                const loadedWithSelect = await bufferSetRepository.findOne({
                    where: { id: entity.id },
                    select: {
                        id: true,
                        BufferData: true,
                        Uint8ArrayData: true,
                    },
                })

                expect(loadedWithSelect).to.exist
                expect(loadedWithSelect!.BufferData).to.exist
                expect(loadedWithSelect!.Uint8ArrayData).to.exist
                expect(loadedWithSelect!.BufferData).to.be.instanceOf(Buffer)
                expect(loadedWithSelect!.Uint8ArrayData).to.be.instanceOf(
                    Uint8Array,
                )

                const loadedUint8Buffer = Buffer.from(
                    loadedWithSelect!.Uint8ArrayData.buffer,
                    loadedWithSelect!.Uint8ArrayData.byteOffset,
                    loadedWithSelect!.Uint8ArrayData.byteLength,
                )
                const originalUint8Buffer = Buffer.from(
                    testUint8Array.buffer,
                    testUint8Array.byteOffset,
                    testUint8Array.byteLength,
                )
                expect(
                    Buffer.compare(loadedUint8Buffer, originalUint8Buffer),
                ).to.equal(0)
                expect(
                    Buffer.compare(loadedWithSelect!.BufferData, testBuffer),
                ).to.equal(0)
            }),
        )
    })
})
