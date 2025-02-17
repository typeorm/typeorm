import { DataSource, QueryRunner } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { View } from "./entity/View"
import { expect } from "chai"
import sinon, { SinonSpy } from "sinon"

describe("DataSource.runWithQueryRunner", () => {
    let connections: DataSource[]
    beforeEach(() =>
        createTestingConnections({
            entities: [View],
            dropSchema: true,
            // Managing the context does not differ between drivers, but to test the context function
            // we use one that use and one that does not use ReplicationMode
            enabledDrivers: ["sqlite", "mysql"],
        }).then((all) => (connections = all)),
    )
    afterEach(() => closeTestingConnections([...connections.values()]))

    it("should create new temporary runner if none exists", async () => {
        for (const dataSource of connections) {
            let qr: QueryRunner
            let releaseSpy: SinonSpy
            await dataSource.runWithQueryRunner(async (queryRunner) => {
                qr = queryRunner
                releaseSpy = sinon.spy(qr, "release")
            })

            expect(qr!).not.to.to.be.null
            expect(releaseSpy!.callCount).to.eq(1)
        }
    })

    it("should not release if callback parameter is given in handler fn", async () => {
        for (const dataSource of connections) {
            let qr: QueryRunner
            let passedInReleaseFunction: () => Promise<void>

            // We base our assertions on the call to release, and not the isReleased bool, since
            // some drivers without connections don't release even when calling the function.
            let releaseSpy: SinonSpy
            await dataSource.runWithQueryRunner(
                async (
                    queryRunner: QueryRunner,
                    release: () => Promise<void>,
                ) => {
                    passedInReleaseFunction = release
                    qr = queryRunner
                    releaseSpy = sinon.spy(qr, "release")
                },
            )

            expect(passedInReleaseFunction!).to.not.be.null
            expect(qr!).not.to.to.be.null
            expect(releaseSpy!.callCount).to.eq(0)

            // We expect calling the release callback to release it
            expect(await passedInReleaseFunction!()).to.be.undefined
            expect(releaseSpy!.callCount).to.eq(1)
        }
    })

    it("should not release existing query runner using callback", async () => {
        for (const dataSource of connections) {
            const existingRunner = dataSource.createQueryRunner()
            let qr: QueryRunner
            let passedInReleaseFunction: () => Promise<void>

            // We base our assertions on the call to release, and not the isReleased bool, since
            // some drivers without connections don't release even when calling the function.
            let releaseSpy: SinonSpy
            await dataSource.runWithQueryRunner(
                existingRunner,
                async (
                    queryRunner: QueryRunner,
                    release: () => Promise<void>,
                ) => {
                    passedInReleaseFunction = release
                    qr = queryRunner
                    releaseSpy = sinon.spy(qr, "release")
                },
            )

            expect(passedInReleaseFunction!).to.not.be.null
            expect(qr!).not.to.to.be.null
            expect(releaseSpy!.callCount).to.eq(0)

            // We expect calling the release callback to do nothing
            expect(await passedInReleaseFunction!()).to.be.undefined
            expect(releaseSpy!.callCount).to.eq(0)

            // Extra assertion to make sure we are asserting the correct spy.
            await existingRunner.release()
            expect(releaseSpy!.callCount).to.eq(1)
        }
    })

    it("should reuse existing query runner", async () => {
        for (const dataSource of connections) {
            const existingQueryRunner = dataSource.createQueryRunner()
            let qr: QueryRunner
            let releaseSpy: SinonSpy
            await dataSource.runWithQueryRunner(
                existingQueryRunner,
                async (queryRunner) => {
                    qr = queryRunner
                    releaseSpy = sinon.spy(qr, "release")
                },
            )

            expect(qr!).not.to.to.be.null
            expect(qr!).to.equal(existingQueryRunner)
            expect(releaseSpy!.callCount).to.eq(0)
        }
    })

    it("should create runner using mode parameter", async () => {
        for (const dataSource of connections) {
            const defaultOne = dataSource.createQueryRunner()
            const master = dataSource.createQueryRunner("master")
            const slave = dataSource.createQueryRunner("slave")

            let defaultCreated: QueryRunner
            let masterCreated: QueryRunner
            let slaveCreated: QueryRunner

            await Promise.all([
                dataSource.runWithQueryRunner(async (queryRunner) => {
                    defaultCreated = queryRunner
                }),
                dataSource.runWithQueryRunner(
                    undefined,
                    "master",
                    async (queryRunner) => {
                        masterCreated = queryRunner
                    },
                ),
                dataSource.runWithQueryRunner(
                    undefined,
                    "slave",
                    async (queryRunner) => {
                        slaveCreated = queryRunner
                    },
                ),
            ])

            expect(defaultOne.getReplicationMode()).to.equal(
                defaultCreated!.getReplicationMode(),
            )
            expect(master.getReplicationMode()).to.equal(
                masterCreated!.getReplicationMode(),
            )
            expect(slave.getReplicationMode()).to.equal(
                slaveCreated!.getReplicationMode(),
            )
        }
    })
})
