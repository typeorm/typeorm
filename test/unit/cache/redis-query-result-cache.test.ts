/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "chai"
import * as sinon from "sinon"
import { RedisQueryResultCache } from "../../../src/cache/RedisQueryResultCache"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import { DataSource } from "../../../src/data-source/DataSource"

describe("RedisQueryResultCache", () => {
    describe("detectRedisVersion", () => {
        let sandbox: sinon.SinonSandbox
        let mockDataSource: sinon.SinonStubbedInstance<DataSource>
        let readPackageVersionStub: sinon.SinonStub

        beforeEach(() => {
            sandbox = sinon.createSandbox()

            // Create a mock DataSource
            mockDataSource = {
                options: {},
                logger: {
                    log: sandbox.stub(),
                },
            } as any

            // Stub PlatformTools.readPackageVersion
            readPackageVersionStub = sandbox.stub(
                PlatformTools,
                "readPackageVersion",
            )

            // Stub PlatformTools.load to prevent actual redis loading
            sandbox.stub(PlatformTools, "load").returns({})
        })

        afterEach(() => {
            sandbox.restore()
        })

        it("should detect Redis v3.x and set redisMajorVersion to 3", () => {
            readPackageVersionStub.returns("3.1.2")

            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "redis",
            )

            // Access the private method via any cast for testing
            ;(cache as any).detectRedisVersion()

            expect((cache as any).redisMajorVersion).to.equal(3)
            expect(readPackageVersionStub.calledOnceWith("redis")).to.be.true
        })

        it("should detect Redis v4.x and set redisMajorVersion to 3 (callback-based)", () => {
            readPackageVersionStub.returns("4.6.13")

            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "redis",
            )

            ;(cache as any).detectRedisVersion()

            expect((cache as any).redisMajorVersion).to.equal(3)
        })

        it("should detect Redis v5.x and set redisMajorVersion to 5 (Promise-based)", () => {
            readPackageVersionStub.returns("5.0.0")

            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "redis",
            )

            ;(cache as any).detectRedisVersion()

            expect((cache as any).redisMajorVersion).to.equal(5)
            expect(readPackageVersionStub.calledOnceWith("redis")).to.be.true
        })

        it("should detect Redis v6.x and set redisMajorVersion to 5 (Promise-based)", () => {
            readPackageVersionStub.returns("6.2.3")

            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "redis",
            )

            ;(cache as any).detectRedisVersion()

            expect((cache as any).redisMajorVersion).to.equal(5)
        })

        it("should detect Redis v7.x and set redisMajorVersion to 5 (Promise-based)", () => {
            readPackageVersionStub.returns("7.0.0")

            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "redis",
            )

            ;(cache as any).detectRedisVersion()

            expect((cache as any).redisMajorVersion).to.equal(5)
        })
    })
})
