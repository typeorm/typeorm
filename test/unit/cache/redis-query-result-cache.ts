import "../../utils/test-setup"

import { expect } from "chai"
import sinon from "sinon"

import { RedisQueryResultCache } from "../../../src/cache/RedisQueryResultCache"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import { DataSource } from "../../../src/data-source/DataSource"

type RedisCallback<T = unknown> = (err: Error | null, result: T) => void

describe("RedisQueryResultCache", () => {
    let sandbox: sinon.SinonSandbox

    beforeEach(() => {
        sandbox = sinon.createSandbox()
    })

    afterEach(() => {
        sandbox.restore()
    })

    it("detects redis v3 clients without connect as callback-based", async () => {
        const redis3Client = {
            get(_key: string, cb: RedisCallback<string | null>) {
                cb(null, null)
            },
            set(
                _key: string,
                _value: string,
                flagOrOptions: unknown,
                durationOrCallback: unknown,
                maybeCallback?: RedisCallback,
            ) {
                if (typeof flagOrOptions === "function") {
                    ;(flagOrOptions as RedisCallback<string>)(null, "OK")
                    return
                }

                if (typeof durationOrCallback === "function") {
                    ;(durationOrCallback as RedisCallback<string>)(null, "OK")
                    return
                }

                if (typeof maybeCallback === "function") {
                    maybeCallback(null, "OK")
                }
            },
            del(_key: string, cb: RedisCallback<number>) {
                cb(null, 1)
            },
            flushdb(cb: RedisCallback<string>) {
                cb(null, "OK")
            },
            quit(cb: RedisCallback<string>) {
                cb(null, "OK")
            },
        }

        const createClientStub = sandbox.stub().returns(redis3Client)

        sandbox
            .stub(PlatformTools, "load")
            .withArgs("redis")
            .returns({ createClient: createClientStub })

        const connection = {
            options: { cache: {} },
            logger: { log: () => {} },
        } as unknown as DataSource

        const cache = new RedisQueryResultCache(connection, "redis")

        await cache.connect()

        const internals = cache as unknown as {
            redisMajorVersion: number | undefined
            shouldUsePromiseApi(): boolean
        }

        expect(internals.redisMajorVersion).to.equal(3)
        expect(internals.shouldUsePromiseApi()).to.equal(false)
        expect(createClientStub.callCount).to.equal(1)

        await cache.disconnect()
    })

    it("treats clients using legacy mode as callback-based even when version is 5+", async () => {
        const firstClient = {
            connect: sandbox.stub().resolves(),
        }

        const legacyQuit = sandbox
            .stub()
            .callsFake((cb?: RedisCallback<string>) => {
                if (cb) {
                    cb(null, "OK")
                }
            })

        const secondClient = {
            connect: sandbox.stub().resolves(),
            set: (
                _key: string,
                _value: string,
                _options?: Record<string, unknown>,
            ) => Promise.resolve("OK"),
            get: sandbox.stub().resolves(null),
            del: sandbox.stub().resolves(1),
            flushdb: sandbox.stub().resolves("OK"),
            quit: legacyQuit,
            on: sandbox.stub(),
        }

        const createClientStub = sandbox.stub()
        createClientStub.onFirstCall().returns(firstClient)
        createClientStub.onSecondCall().returns(secondClient)

        sandbox
            .stub(PlatformTools, "load")
            .withArgs("redis")
            .returns({ createClient: createClientStub })

        const connection = {
            options: { cache: {} },
            logger: { log: () => {} },
        } as unknown as DataSource

        const cache = new RedisQueryResultCache(connection, "redis")

        await cache.connect()

        expect(createClientStub.callCount).to.equal(2)
        expect(createClientStub.getCall(1).args[0]).to.have.property(
            "legacyMode",
            true,
        )
        const internals = cache as unknown as {
            isLegacyMode: boolean
            redisMajorVersion: number | undefined
            shouldUsePromiseApi(): boolean
        }
        expect(internals.isLegacyMode).to.equal(true)
        expect(internals.redisMajorVersion).to.equal(5)
        expect(internals.shouldUsePromiseApi()).to.equal(false)

        await cache.disconnect()
        expect(legacyQuit.callCount).to.equal(1)
    })
})
