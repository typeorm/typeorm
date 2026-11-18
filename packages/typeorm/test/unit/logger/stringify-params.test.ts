import { expect } from "chai"
import { AbstractLogger } from "../../../src/logger/AbstractLogger"
import type { LogLevel, LogMessage } from "../../../src/logger/Logger"

// see https://github.com/typeorm/typeorm/issues/10515

/**
 * Exposes the protected parameter stringifier, which is what a concrete
 * logger uses to render query parameters.
 */
class ProbeLogger extends AbstractLogger {
    protected writeLog(
        _level: LogLevel,
        _message:
            LogMessage | string | number | (LogMessage | string | number)[],
    ): void {}

    stringify(parameters: any[]): string {
        return this.stringifyParams(parameters) as string
    }
}

describe("AbstractLogger > stringifyParams", () => {
    const logger = new ProbeLogger("all")

    it("summarises a buffer too large to serialise", () => {
        const result = logger.stringify([Buffer.alloc(200_000)])

        expect(result).to.equal('["<Buffer(200000 bytes)>"]')
    })

    it("keeps the log line small no matter how large the buffer is", () => {
        const result = logger.stringify([Buffer.alloc(50_000_000)])

        // serialising this would produce well over 100MB of digits
        expect(result.length).to.be.lessThan(60)
    })

    it("summarises any binary view, not only Buffer", () => {
        const result = logger.stringify([new Uint8Array(4096)])

        expect(result).to.equal('["<Uint8Array(4096 bytes)>"]')
    })

    it("still serialises a small buffer in full", () => {
        const result = logger.stringify([Buffer.from("hi")])

        expect(result).to.equal('[{"type":"Buffer","data":[104,105]}]')
    })

    it("leaves ordinary parameters byte for byte as they were", () => {
        expect(logger.stringify([1, "a", null, { b: [2] }])).to.equal(
            '[1,"a",null,{"b":[2]}]',
        )
    })

    it("renders an unrepresentable parameter as null, as before", () => {
        expect(logger.stringify([undefined])).to.equal("[null]")
    })

    it("renders a hole in a sparse array as null", () => {
        // a hole at index 0, built without a sparse-array literal
        const sparse: any[] = new Array(2)
        sparse[1] = 1

        expect(logger.stringify(sparse)).to.equal("[null,1]")
    })

    it("still passes the element index to a custom toJSON", () => {
        class Keyed {
            toJSON(key: string) {
                return `key=${key}`
            }
        }

        expect(logger.stringify([new Keyed(), new Keyed()])).to.equal(
            '["key=0","key=1"]',
        )
    })

    it("falls back to the raw parameters when they cannot be serialised", () => {
        const circular: any = { a: 1 }
        circular.self = circular

        expect(logger.stringify([circular])).to.not.be.a("string")
    })
})
