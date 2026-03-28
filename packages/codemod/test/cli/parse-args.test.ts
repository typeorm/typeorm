import { expect } from "chai"
import sinon from "sinon"
import { parseArgs } from "../../src/cli/parse-args"

describe("parseArgs", () => {
    let exitStub: sinon.SinonStub
    let stderrStub: sinon.SinonStub

    beforeEach(() => {
        exitStub = sinon.stub(process, "exit")
        stderrStub = sinon.stub(console, "error")
    })

    afterEach(() => {
        exitStub.restore()
        stderrStub.restore()
    })

    describe("version", () => {
        it("should parse as first positional argument", () => {
            const result = parseArgs(["v1", "src/"])
            expect(result.version).to.equal("v1")
        })

        it("should return empty string when no args", () => {
            const result = parseArgs([])
            expect(result.version).to.equal("")
        })
    })

    describe("--dry", () => {
        it("should parse long flag", () => {
            const result = parseArgs(["v1", "--dry", "src/"])
            expect(result.dry).to.be.true
        })

        it("should parse short flag -d", () => {
            const result = parseArgs(["v1", "-d", "src/"])
            expect(result.dry).to.be.true
        })
    })

    describe("--list", () => {
        it("should parse long flag", () => {
            const result = parseArgs(["v1", "--list"])
            expect(result.list).to.be.true
        })

        it("should parse short flag -l", () => {
            const result = parseArgs(["v1", "-l"])
            expect(result.list).to.be.true
        })
    })

    describe("--transform", () => {
        it("should parse long option with value", () => {
            const result = parseArgs([
                "v1",
                "--transform",
                "rename-find-by-ids",
                "src/",
            ])
            expect(result.transform).to.equal("rename-find-by-ids")
        })

        it("should parse short option -t", () => {
            const result = parseArgs(["v1", "-t", "rename-find-by-ids", "src/"])
            expect(result.transform).to.equal("rename-find-by-ids")
        })
    })

    describe("paths", () => {
        it("should collect single path", () => {
            const result = parseArgs(["v1", "src/"])
            expect(result.paths).to.deep.equal(["src/"])
        })

        it("should collect multiple paths", () => {
            const result = parseArgs(["v1", "src/", "lib/", "app/"])
            expect(result.paths).to.deep.equal(["src/", "lib/", "app/"])
        })

        it("should return empty array when no paths", () => {
            const result = parseArgs([])
            expect(result.paths).to.deep.equal([])
        })
    })

    describe("combined", () => {
        it("should handle all options together", () => {
            const result = parseArgs([
                "v1",
                "-t",
                "my-transform",
                "--dry",
                "src/",
                "lib/",
            ])
            expect(result.version).to.equal("v1")
            expect(result.transform).to.equal("my-transform")
            expect(result.dry).to.be.true
            expect(result.paths).to.deep.equal(["src/", "lib/"])
        })
    })

    describe("validation", () => {
        describe("--transform", () => {
            it("should exit when value is missing", () => {
                parseArgs(["v1", "--transform"])
                expect(exitStub.calledWith(1)).to.be.true
            })

            it("should exit when value looks like a flag", () => {
                parseArgs(["v1", "--transform", "--dry"])
                expect(exitStub.calledWith(1)).to.be.true
            })
        })

        describe("--ignore", () => {
            it("should exit when value is missing", () => {
                parseArgs(["v1", "--ignore"])
                expect(exitStub.calledWith(1)).to.be.true
            })
        })

        describe("--workers", () => {
            it("should exit when value is missing", () => {
                parseArgs(["v1", "--workers"])
                expect(exitStub.calledWith(1)).to.be.true
            })

            it("should exit when value is not a number", () => {
                parseArgs(["v1", "--workers", "abc"])
                expect(exitStub.calledWith(1)).to.be.true
            })

            it("should exit when value is zero", () => {
                parseArgs(["v1", "--workers", "0"])
                expect(exitStub.calledWith(1)).to.be.true
            })

            it("should exit when value is negative", () => {
                parseArgs(["v1", "--workers", "-1"])
                expect(exitStub.calledWith(1)).to.be.true
            })
        })
    })
})
