import { expect } from "chai"

import { PlatformTools } from "../../../src/platform/PlatformTools"

const INSTALLED_CLIENT_LIBRARIES = [
    "@google-cloud/spanner",
    "@sap/hana-client",
    "@sap/hana-client/extension/Stream",
    "better-sqlite3",
    "ioredis",
    "mongodb",
    "mssql",
    "mysql2",
    "oracledb",
    "pg-query-stream",
    "pg",
    "redis",
    "sql.js",
    "typeorm-aurora-data-api-driver",
]

const NOT_INSTALLED_CLIENT_LIBRARIES = [
    "expo-sqlite",
    "react-native-sqlite-storage",
]

describe("PlatformTools > load", () => {
    describe("invalid modules", () => {
        it("should throw TypeError for unknown modules that don't exist", () => {
            expect(() =>
                PlatformTools.load("nonexistent-fake-module-xyz"),
            ).to.throw(
                TypeError,
                "Invalid Package for PlatformTools.load: nonexistent-fake-module-xyz",
            )
        })

        it("should throw TypeError for unknown modules that do exist", () => {
            expect(() => PlatformTools.load("path")).to.throw(
                TypeError,
                "Invalid Package for PlatformTools.load: path",
            )
        })
    })

    describe("installed modules", () => {
        for (const library of INSTALLED_CLIENT_LIBRARIES) {
            it(`should be loaded for "${library}"`, () => {
                expect(() => PlatformTools.load(library)).not.to.throw()
            })
        }

        it("should throw when library fails to load for reasons other than MODULE_NOT_FOUND", () => {
            // `libpq` is in `ignoredBuiltDependencies`
            expect(() => PlatformTools.load("pg-native")).to.throw(
                "Could not locate the bindings file",
            )
        })
    })

    describe("not installed modules", () => {
        for (const library of NOT_INSTALLED_CLIENT_LIBRARIES) {
            it(`should throw for "${library}" with MODULE_NOT_FOUND`, () => {
                expect(() => PlatformTools.load(library)).to.throw(
                    "Cannot find module",
                )
            })
        }
    })
})
