import { expect } from "chai"
import * as sinon from "sinon"
import { RedisQueryResultCache } from "../../../src/cache/RedisQueryResultCache"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import { DataSource } from "../../../src/data-source/DataSource"

describe("RedisQueryResultCache", () => {
    describe("sets redisMajorVersion", () => {
        let sandbox: sinon.SinonSandbox
        let mockDataSource: sinon.SinonStubbedInstance<DataSource>
        let loadStub: sinon.SinonStub

        beforeEach(() => {
            sandbox = sinon.createSandbox()

            // Create a mock DataSource
            mockDataSource = {
                options: {},
                logger: {
                    log: sandbox.stub(),
                },
            } as any

            // Stub PlatformTools.load
            loadStub = sandbox.stub(PlatformTools, "load")
        })

        afterEach(() => {
            sandbox.restore()
        })

        const versionTestCases = [
            { version: "3.1.2", expectedMajor: 3, isPromiseBased: false },
            { version: "4.6.13", expectedMajor: 4, isPromiseBased: false },
            { version: "5.0.0", expectedMajor: 5, isPromiseBased: true },
            { version: "6.2.3", expectedMajor: 6, isPromiseBased: true },
            { version: "7.0.0", expectedMajor: 7, isPromiseBased: true },
        ]

        versionTestCases.forEach(
            ({ version, expectedMajor, isPromiseBased }) => {
                it(`detects Redis v${expectedMajor}.x from version "${version}"`, () => {
                    loadStub.returns({ version })

                    const cache = new RedisQueryResultCache(
                        mockDataSource as any,
                        "redis",
                    )

                    ;(cache as any).connect()

                    expect((cache as any).redisMajorVersion).to.equal(
                        expectedMajor,
                    )
                    expect((cache as any).isPromiseBasedApi()).to.equal(
                        isPromiseBased,
                    )
                    expect(loadStub.calledWith("redis")).to.be.true
                })
            },
        )

        it("skips version detection for ioredis", () => {
            loadStub.returns({})

            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "ioredis",
            )

            ;(cache as any).connect()

            expect((cache as any).redisMajorVersion).to.be.undefined
            expect((cache as any).isPromiseBasedApi()).to.be.false
        })

        it("skips version detection for ioredis/cluster", () => {
            loadStub.returns({ Cluster: class {} })

            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "ioredis/cluster",
            )

            ;(cache as any).connect()

            expect((cache as any).redisMajorVersion).to.be.undefined
            expect((cache as any).isPromiseBasedApi()).to.be.false
        })

        it("throws error for invalid version format", async () => {
            loadStub.returns({ version: "invalid" })

            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "redis",
            )

            await expect((cache as any).connect()).to.be.rejectedWith(
                "Invalid Redis version format: invalid",
            )
        })

        it("throws error when version is undefined", async () => {
            loadStub.returns({ version: undefined })

            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "redis",
            )

            await expect((cache as any).connect()).to.be.rejectedWith(
                "Invalid Redis version format: undefined",
            )
        })

        it("handles prerelease versions correctly", () => {
            loadStub.returns({ version: "5.0.0-rc1" })

            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "redis",
            )

            ;(cache as any).connect()

            expect((cache as any).redisMajorVersion).to.equal(5)
            expect((cache as any).isPromiseBasedApi()).to.be.true
        })
    })
})
