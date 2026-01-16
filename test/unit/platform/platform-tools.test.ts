import { expect } from "chai"
import * as sinon from "sinon"
import { PlatformTools } from "../../../src/platform/PlatformTools"

describe("PlatformTools", () => {
    describe("readPackageVersion", () => {
        let sandbox: sinon.SinonSandbox

        beforeEach(() => {
            sandbox = sinon.createSandbox()
        })

        afterEach(() => {
            sandbox.restore()
        })

        it("should successfully read version from an installed package", () => {
            // Test with a package we know exists in node_modules (chai is in devDependencies)
            const version = PlatformTools.readPackageVersion("chai")

            expect(version).to.be.a("string")
            expect(version).to.match(/^\d+\.\d+\.\d+/)
        })

        it("should return correct version format with major.minor.patch", () => {
            const version = PlatformTools.readPackageVersion("chai")

            expect(version).to.be.a("string")
            expect(version.split(".").length).to.be.at.least(3)
        })

        it("should throw TypeError when package does not exist", () => {
            expect(() => {
                PlatformTools.readPackageVersion(
                    "this-package-definitely-does-not-exist-12345",
                )
            }).to.throw(
                TypeError,
                /Failed to read package\.json for "this-package-definitely-does-not-exist-12345"/,
            )
        })

        it("should handle scoped package names", () => {
            const version = PlatformTools.readPackageVersion("@types/node")

            expect(version).to.be.a("string")
            expect(version).to.match(/^\d+/)
        })

        it("should throw error for empty package name", () => {
            expect(() => {
                PlatformTools.readPackageVersion("")
            }).to.throw(TypeError, /Failed to read package\.json/)
        })

        it("should throw error for whitespace-only package name", () => {
            expect(() => {
                PlatformTools.readPackageVersion("   ")
            }).to.throw(TypeError, /Failed to read package\.json/)
        })
    })
})
