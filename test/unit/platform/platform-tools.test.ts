import { expect } from "chai"
import "reflect-metadata"

import { PlatformTools } from "../../../src/platform/PlatformTools"

describe("PlatformTools > load", () => {
    describe("module validation", () => {
        it("should throw TypeError for unknown module names", () => {
            expect(() => PlatformTools.load("nonexistent-fake-module-xyz")).to.throw(
                TypeError,
                "Invalid Package for PlatformTools.load: nonexistent-fake-module-xyz",
            )
        })

        it("should throw TypeError for built-in modules not in the switch", () => {
            // "path" is a Node.js built-in but not in the PlatformTools switch,
            // so it must be rejected to prevent loading arbitrary modules
            expect(() => PlatformTools.load("path")).to.throw(
                TypeError,
                "Invalid Package for PlatformTools.load: path",
            )
        })
    })

    describe("static require calls for bundler compatibility", () => {
        it("should include all known modules as static require cases", () => {
            // Verify the switch covers the full set of supported driver modules.
            // These are the module names that must have explicit require() calls
            // so bundlers can statically analyze them (issue #12721).
            const expectedModules = [
                "typeorm-aurora-data-api-driver",
                "better-sqlite3",
                "expo-sqlite",
                "@google-cloud/spanner",
                "mssql",
                "mongodb",
                "mysql2",
                "oracledb",
                "pg",
                "pg-native",
                "pg-query-stream",
                "react-native-sqlite-storage",
                "@sap/hana-client",
                "@sap/hana-client/extension/Stream",
                "sql.js",
                "redis",
                "ioredis",
            ]

            for (const mod of expectedModules) {
                // Each must be recognized (not throw "Invalid Package" TypeError).
                // Some may fail to resolve at runtime (not installed), but the
                // key assertion is that they are in the switch and not rejected
                // as "unknown".
                try {
                    PlatformTools.load(mod)
                } catch (e: any) {
                    expect(e.message).to.not.include(
                        "Invalid Package",
                        `Module "${mod}" is not in the static require switch`,
                    )
                }
            }
        })
    })
})
