import { expect } from "chai"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import {
    type PackageJson,
    upgradeDependencies,
} from "../../src/dependencies/upgrade"
import { config } from "../../src/dependencies/v1"

describe("upgrade-dependencies", () => {
    let tmpDir: string

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "codemod-test-"))
    })

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true })
    })

    const writePackageJson = (content: object): string => {
        const filePath = path.join(tmpDir, "package.json")
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2))
        return filePath
    }

    const readPackageJson = (filePath: string): PackageJson =>
        JSON.parse(fs.readFileSync(filePath, "utf8")) as PackageJson

    it("should replace sqlite3 with better-sqlite3", () => {
        const file = writePackageJson({
            dependencies: { typeorm: "^1.0.0", sqlite3: "^5.1.0" },
        })

        const report = upgradeDependencies(file, false, config)
        const pkg = readPackageJson(file)

        expect(pkg.dependencies?.sqlite3).to.be.undefined
        expect(pkg.dependencies?.["better-sqlite3"]).to.equal("^12.9.0")
        expect(report.changes).to.have.length(1)
        expect(report.changes[0]).to.include("replaced")
    })

    it("should replace mysql with mysql2", () => {
        const file = writePackageJson({
            dependencies: { typeorm: "^1.0.0", mysql: "^2.18.1" },
        })

        const report = upgradeDependencies(file, false, config)
        const pkg = readPackageJson(file)

        expect(pkg.dependencies?.mysql).to.be.undefined
        expect(pkg.dependencies?.mysql2).to.equal("^3.22.0")
        expect(report.changes).to.have.length(1)
    })

    it("should not add mysql2 if already present", () => {
        const file = writePackageJson({
            dependencies: {
                mysql: "^2.18.1",
                mysql2: "^3.15.3",
            },
        })

        const report = upgradeDependencies(file, false, config)
        const pkg = readPackageJson(file)

        expect(pkg.dependencies?.mysql).to.be.undefined
        expect(pkg.dependencies?.mysql2).to.equal("^3.15.3")
        expect(report.changes[0]).to.include("already present")
    })

    it("should bump mongodb below minimum version", () => {
        const file = writePackageJson({
            dependencies: { mongodb: "^6.0.0" },
        })

        const report = upgradeDependencies(file, false, config)
        const pkg = readPackageJson(file)

        expect(pkg.dependencies?.mongodb).to.equal("^7.1.1")
        expect(report.changes).to.have.length(1)
        expect(report.changes[0]).to.include("bumped")
    })

    it("should not bump mongodb already at minimum", () => {
        const file = writePackageJson({
            dependencies: { mongodb: "^7.1.0" },
        })

        const report = upgradeDependencies(file, false, config)

        expect(report.changes).to.have.length(0)
    })

    it("should report error for incompatible packages", () => {
        const file = writePackageJson({
            dependencies: {
                typeorm: "^1.0.0",
                "typeorm-typedi-extensions": "^0.4.0",
            },
        })

        const report = upgradeDependencies(file, false, config)

        expect(report.errors).to.have.length(1)
        expect(report.errors[0]).to.include("incompatible")
    })

    it("should warn about low Node.js engine", () => {
        const file = writePackageJson({
            engines: { node: ">=16" },
        })

        const report = upgradeDependencies(file, false, config)

        expect(report.warnings).to.have.length(1)
        expect(report.warnings[0]).to.include("Node.js")
    })

    it("should not warn about adequate Node.js engine", () => {
        const file = writePackageJson({
            engines: { node: ">=20" },
        })

        const report = upgradeDependencies(file, false, config)

        expect(report.warnings).to.have.length(0)
    })

    it("should warn about dotenv dependency", () => {
        const file = writePackageJson({
            dependencies: { dotenv: "^16.0.0" },
        })

        const report = upgradeDependencies(file, false, config)

        expect(report.warnings).to.have.length(1)
        expect(report.warnings[0]).to.include("dotenv")
    })

    it("should bump @nestjs/typeorm below 11.0.1", () => {
        const file = writePackageJson({
            dependencies: { "@nestjs/typeorm": "^10.0.0" },
        })

        const report = upgradeDependencies(file, false, config)
        const pkg = readPackageJson(file)

        expect(pkg.dependencies?.["@nestjs/typeorm"]).to.equal("^11.0.1")
        expect(report.changes).to.have.length(1)
        expect(report.changes[0]).to.include("bumped")
    })

    it("should not bump @nestjs/typeorm already at 11.0.1", () => {
        const file = writePackageJson({
            dependencies: { "@nestjs/typeorm": "^11.0.1" },
        })

        const report = upgradeDependencies(file, false, config)

        expect(report.changes).to.have.length(0)
    })

    it("should report error for typeorm-seeding", () => {
        const file = writePackageJson({
            dependencies: { "typeorm-seeding": "^1.6.0" },
        })

        const report = upgradeDependencies(file, false, config)

        expect(report.errors).to.have.length(1)
        expect(report.errors[0]).to.include("typeorm-seeding")
        expect(report.errors[0]).to.include("incompatible")
    })

    it("should report error for typeorm-naming-strategies", () => {
        const file = writePackageJson({
            dependencies: { "typeorm-naming-strategies": "^4.0.0" },
        })

        const report = upgradeDependencies(file, false, config)

        expect(report.errors).to.have.length(1)
        expect(report.errors[0]).to.include("typeorm-naming-strategies")
        expect(report.errors[0]).to.include("incompatible")
    })

    it("should not modify file in dry mode", () => {
        const file = writePackageJson({
            dependencies: { sqlite3: "^5.1.0" },
        })

        const report = upgradeDependencies(file, true, config)
        const pkg = readPackageJson(file)

        expect(report.changes).to.have.length(1)
        expect(pkg.dependencies?.sqlite3).to.equal("^5.1.0")
    })

    it("should skip non-standard version specifiers with error", () => {
        const file = writePackageJson({
            dependencies: {
                typeorm: "npm:@cool-midway/typeorm@0.3.20",
            },
        })

        const report = upgradeDependencies(file, false, config)
        const pkg = readPackageJson(file)

        expect(pkg.dependencies?.typeorm).to.equal(
            "npm:@cool-midway/typeorm@0.3.20",
        )
        expect(report.changes).to.have.length(0)
        expect(report.errors).to.have.length(1)
        expect(report.errors[0]).to.include("non-standard")
    })

    it("should skip patch protocol version specifiers with error", () => {
        const file = writePackageJson({
            dependencies: {
                typeorm: "patch:typeorm@0.3.20#./patches/typeorm+0.3.20.patch",
            },
        })

        const report = upgradeDependencies(file, false, config)
        const pkg = readPackageJson(file)

        expect(pkg.dependencies?.typeorm).to.equal(
            "patch:typeorm@0.3.20#./patches/typeorm+0.3.20.patch",
        )
        expect(report.changes).to.have.length(0)
        expect(report.errors).to.have.length(1)
        expect(report.errors[0]).to.include("non-standard")
    })

    it("should preserve indentation", () => {
        const filePath = path.join(tmpDir, "package.json")
        fs.writeFileSync(
            filePath,
            JSON.stringify({ dependencies: { sqlite3: "^5.1.0" } }, null, 4),
        )

        upgradeDependencies(filePath, false, config)
        const raw = fs.readFileSync(filePath, "utf8")

        expect(raw).to.match(/^ {4}"dependencies"/m)
    })
})
