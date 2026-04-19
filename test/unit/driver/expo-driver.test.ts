import { expect } from "chai"
import { ExpoDriver } from "../../../src/driver/expo/ExpoDriver"
import type { ExpoDataSourceOptions } from "../../../src/driver/expo/ExpoDataSourceOptions"
import {
    DriverPackageNotInstalledError,
    TypeORMError,
} from "../../../src/error"

// Minimal driver module shape matching the Expo SDK v52+ async surface.
// `loadDependencies()` only inspects `openDatabaseAsync`.
const modernDriver = {
    openDatabaseAsync: () => undefined,
}

const moduleNotFoundError = (): Error & { code?: string } => {
    const err = new Error("Cannot find module 'expo-sqlite'") as Error & {
        code?: string
    }
    err.code = "MODULE_NOT_FOUND"
    return err
}

// Subclass that lets each test control what `require("expo-sqlite")` returns
// without touching Node's module resolver. Exposes `loadDependencies` and
// `sqlite` publicly so assertions don't need type casts.
class TestableExpoDriver extends ExpoDriver {
    declare public sqlite: unknown
    private onRequire: () => unknown = () => {
        throw moduleNotFoundError()
    }

    constructor(
        driverOption: ExpoDataSourceOptions["driver"],
        onRequire?: () => unknown,
    ) {
        // Bypass the real base-class wiring; we only need `loadDependencies`.
        super(Object.create(null))
        Object.assign(this, {
            options: {
                type: "expo",
                database: ":memory:",
                driver: driverOption,
            },
        })
        if (onRequire) this.onRequire = onRequire
    }

    protected requireExpoSqlite(): unknown {
        return this.onRequire()
    }

    public loadDependenciesForTest(): void {
        this.loadDependencies()
    }
}

// The real constructor calls `loadDependencies` before the subclass override
// is ready, so construct via `Object.create` and populate state manually.
const build = (
    driverOption: ExpoDataSourceOptions["driver"],
    onRequire?: () => unknown,
): TestableExpoDriver => {
    const driver = Object.create(
        TestableExpoDriver.prototype,
    ) as TestableExpoDriver
    Object.assign(driver, {
        options: { type: "expo", database: ":memory:", driver: driverOption },
        onRequire:
            onRequire ??
            (() => {
                throw moduleNotFoundError()
            }),
    })
    return driver
}

describe("driver > expo > loadDependencies", () => {
    it("accepts an explicit driver that exposes the modern async API", () => {
        const driver = build(modernDriver)
        driver.loadDependenciesForTest()
        expect(driver.sqlite).to.equal(modernDriver)
    })

    it("throws TypeORMError when the user-supplied driver lacks `openDatabaseAsync`", () => {
        const driver = build({ openDatabase: () => undefined })
        expect(() => driver.loadDependenciesForTest())
            .to.throw(TypeORMError)
            .with.property("message")
            .that.matches(/custom overrides must match/)
    })

    it("throws TypeORMError with a SDK upgrade hint when `expo-sqlite` is installed but stale", () => {
        const staleModule = { openDatabase: () => undefined }
        const driver = build(undefined, () => staleModule)
        expect(() => driver.loadDependenciesForTest())
            .to.throw(TypeORMError)
            .with.property("message")
            .that.matches(/Expo SDK v52 or later/)
    })

    it("loads the module when `requireExpoSqlite()` resolves", () => {
        const driver = build(undefined, () => modernDriver)
        driver.loadDependenciesForTest()
        expect(driver.sqlite).to.equal(modernDriver)
    })

    it("throws DriverPackageNotInstalledError when the module is not found", () => {
        const driver = build(undefined)
        expect(() => driver.loadDependenciesForTest())
            .to.throw(DriverPackageNotInstalledError)
            .with.property("message")
            .that.includes("expo-sqlite")
    })

    it("re-throws non-MODULE_NOT_FOUND errors unchanged", () => {
        const boom = new Error("expo-sqlite crashed during initialization")
        const driver = build(undefined, () => {
            throw boom
        })
        expect(() => driver.loadDependenciesForTest()).to.throw(
            "expo-sqlite crashed during initialization",
        )
    })
})
