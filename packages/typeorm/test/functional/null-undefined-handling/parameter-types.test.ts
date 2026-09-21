import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { StoredFile } from "./entity/StoredFile"

describe("find options > parameter types when invalidWhereValues is configured", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["sap"],
            entities: [StoredFile],
            schemaCreate: true,
            dropSchema: true,
            driverSpecific: {
                invalidWhereValuesBehavior: {
                    null: "throw",
                    undefined: "throw",
                },
            },
        })

        await Promise.all(
            dataSources.map(async (dataSource) => {
                const fileRepository = dataSource.getRepository(StoredFile)

                const files = fileRepository.create([
                    {
                        guid: Buffer.from(
                            "1234567890abcdef1234567890abcdef",
                            "hex",
                        ),
                        name: "file1.txt",
                        size: 9007199254740993n,
                        public: true,
                    },
                    {
                        guid: Buffer.from(
                            "abcdef1234567890abcdef1234567890",
                            "hex",
                        ),
                        name: "file2.txt",
                        size: 9007199254740995n,
                    },
                ])

                await fileRepository.save(files)
            }),
        )
    })
    after(() => closeTestingConnections(dataSources))

    it("should correctly use Buffer values in find options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const fileRepository = dataSource.getRepository(StoredFile)

                const fileFoundByBuffer = await fileRepository.findOneBy({
                    guid: Buffer.from(
                        "1234567890abcdef1234567890abcdef",
                        "hex",
                    ),
                })
                expect(fileFoundByBuffer).to.contain({
                    name: "file1.txt",
                })
            }),
        ))

    it("should correctly use BigInt values in find options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const fileRepository = dataSource.getRepository(StoredFile)

                const fileFoundByBigInt = await fileRepository.findOneBy({
                    size: 9007199254740995n,
                })
                expect(fileFoundByBigInt).to.contain({
                    name: "file2.txt",
                })
            }),
        ))

    it("should correctly use Boolean values in find options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const fileRepository = dataSource.getRepository(StoredFile)

                const fileFoundByBoolean = await fileRepository.findOneBy({
                    public: true,
                })
                expect(fileFoundByBoolean).to.contain({
                    name: "file1.txt",
                })
            }),
        ))
})
