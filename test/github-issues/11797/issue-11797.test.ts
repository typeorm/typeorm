import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { VoterRecord } from "./entity/VoterRecord"
import { VoterFileSnapshot } from "./entity/VoterFileSnapshot"

describe("github issues > #11797 Repository aggregations with joins render ambiguous column references", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly use maximum() with relation filter without ambiguous column error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const voterRepository = dataSource.getRepository(VoterRecord)
                const fileRepository =
                    dataSource.getRepository(VoterFileSnapshot)

                // Create two file snapshots
                const liveFile = await fileRepository.save({
                    status: "LIVE",
                })
                const archivedFile = await fileRepository.save({
                    status: "ARCHIVED",
                })

                // Create voter records for LIVE snapshot
                await voterRepository.save([
                    {
                        stateVoterId: "V001",
                        name: "John Doe",
                        fileSnapshot: liveFile,
                    },
                    {
                        stateVoterId: "V002",
                        name: "Jane Smith",
                        fileSnapshot: liveFile,
                    },
                    {
                        stateVoterId: "V003",
                        name: "Bob Johnson",
                        fileSnapshot: liveFile,
                    },
                ])

                // Create voter records for ARCHIVED snapshot
                await voterRepository.save([
                    {
                        stateVoterId: "V004",
                        name: "Alice Brown",
                        fileSnapshot: archivedFile,
                    },
                    {
                        stateVoterId: "V005",
                        name: "Charlie Davis",
                        fileSnapshot: archivedFile,
                    },
                ])

                // Test maximum() with relation filter - should not throw ambiguous column error
                const maxId = await voterRepository.maximum("id", {
                    fileSnapshot: { id: liveFile.id },
                })

                expect(maxId).to.not.equal(null)
                expect(maxId).to.be.a("number")

                // Verify that we got the max ID from LIVE snapshot only
                const liveRecords = await voterRepository.find({
                    where: { fileSnapshot: { id: liveFile.id } },
                    order: { id: "DESC" },
                })
                expect(maxId).to.equal(liveRecords[0].id)
            }),
        ))

    it("should correctly use minimum() with relation filter without ambiguous column error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const voterRepository = dataSource.getRepository(VoterRecord)
                const fileRepository =
                    dataSource.getRepository(VoterFileSnapshot)

                const liveFile = await fileRepository.save({
                    status: "LIVE",
                })

                await voterRepository.save([
                    {
                        stateVoterId: "V001",
                        name: "John Doe",
                        fileSnapshot: liveFile,
                    },
                    {
                        stateVoterId: "V002",
                        name: "Jane Smith",
                        fileSnapshot: liveFile,
                    },
                ])

                const minId = await voterRepository.minimum("id", {
                    fileSnapshot: { id: liveFile.id },
                })

                expect(minId).to.not.equal(null)
                expect(minId).to.be.a("number")

                const liveRecords = await voterRepository.find({
                    where: { fileSnapshot: { id: liveFile.id } },
                    order: { id: "ASC" },
                })
                expect(minId).to.equal(liveRecords[0].id)
            }),
        ))

    it("should correctly use sum() with relation filter without ambiguous column error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const voterRepository = dataSource.getRepository(VoterRecord)
                const fileRepository =
                    dataSource.getRepository(VoterFileSnapshot)

                const liveFile = await fileRepository.save({
                    status: "LIVE",
                })

                const savedRecords = await voterRepository.save([
                    {
                        stateVoterId: "V001",
                        name: "John Doe",
                        fileSnapshot: liveFile,
                    },
                    {
                        stateVoterId: "V002",
                        name: "Jane Smith",
                        fileSnapshot: liveFile,
                    },
                ])

                const sumId = await voterRepository.sum("id", {
                    fileSnapshot: { id: liveFile.id },
                })

                expect(sumId).to.not.equal(null)
                expect(sumId).to.be.a("number")

                // Verify the sum is correct
                const expectedSum = savedRecords.reduce(
                    (acc, record) => acc + record.id,
                    0,
                )
                expect(sumId).to.equal(expectedSum)
            }),
        ))

    it("should correctly use average() with relation filter without ambiguous column error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const voterRepository = dataSource.getRepository(VoterRecord)
                const fileRepository =
                    dataSource.getRepository(VoterFileSnapshot)

                const liveFile = await fileRepository.save({
                    status: "LIVE",
                })

                const savedRecords = await voterRepository.save([
                    {
                        stateVoterId: "V001",
                        name: "John Doe",
                        fileSnapshot: liveFile,
                    },
                    {
                        stateVoterId: "V002",
                        name: "Jane Smith",
                        fileSnapshot: liveFile,
                    },
                ])

                const avgId = await voterRepository.average("id", {
                    fileSnapshot: { id: liveFile.id },
                })

                expect(avgId).to.not.equal(null)
                expect(avgId).to.be.a("number")

                // Verify the average is correct
                const expectedAvg =
                    savedRecords.reduce((acc, record) => acc + record.id, 0) /
                    savedRecords.length
                expect(avgId).to.equal(expectedAvg)
            }),
        ))

    it("should work with multiple relation levels in where clause", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const voterRepository = dataSource.getRepository(VoterRecord)
                const fileRepository =
                    dataSource.getRepository(VoterFileSnapshot)

                const liveFile = await fileRepository.save({
                    status: "LIVE",
                })
                const archivedFile = await fileRepository.save({
                    status: "ARCHIVED",
                })

                await voterRepository.save([
                    {
                        stateVoterId: "V001",
                        name: "John Doe",
                        fileSnapshot: liveFile,
                    },
                    {
                        stateVoterId: "V002",
                        name: "Jane Smith",
                        fileSnapshot: liveFile,
                    },
                    {
                        stateVoterId: "V003",
                        name: "Bob Johnson",
                        fileSnapshot: archivedFile,
                    },
                ])

                // Test with complex where clause
                const maxId = await voterRepository.maximum("id", {
                    fileSnapshot: { id: liveFile.id, status: "LIVE" },
                })

                expect(maxId).to.not.equal(null)
                expect(maxId).to.be.a("number")
            }),
        ))

    it("should return null when no records match the relation filter", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const voterRepository = dataSource.getRepository(VoterRecord)
                const fileRepository =
                    dataSource.getRepository(VoterFileSnapshot)

                const liveFile = await fileRepository.save({
                    status: "LIVE",
                })

                // Don't create any voter records for this snapshot

                const maxId = await voterRepository.maximum("id", {
                    fileSnapshot: { id: liveFile.id },
                })

                expect(maxId).to.be.equal(null)
            }),
        ))
})
