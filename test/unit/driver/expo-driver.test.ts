import { expect } from "chai"
import { ExpoDriver } from "../../../src/driver/expo/ExpoDriver"
import {
    DriverPackageNotInstalledError,
    TypeORMError,
} from "../../../src/error"

// Minimal mock matching the Expo SDK v52+ async surface. We only need
// `openDatabaseAsync` to be a function for `loadDependencies()` to accept it.
const modernDriver = {
    openDatabaseAsync: () => undefined,
}

type LoadableDriver = ExpoDriver & {
    options: { driver?: unknown }
    sqlite: unknown
    loadDependencies: () => void
}

const makeDriver = (driverOption: unknown): LoadableDriver => {
    const instance = Object.create(ExpoDriver.prototype) as LoadableDriver
    ;(instance as unknown as { options: unknown }).options = {
        driver: driverOption,
    }
    return instance
}

describe("driver > expo > loadDependencies", () => {
    it("accepts an explicit driver that exposes the modern async API", () => {
        const instance = makeDriver(modernDriver)
        instance.loadDependencies()
        expect(instance.sqlite).to.equal(modernDriver)
    })

    it("throws a TypeORMError when the driver is missing `openDatabaseAsync` (pre-v52 SDK)", () => {
        const instance = makeDriver({ openDatabase: () => undefined })
        expect(() => instance.loadDependencies())
            .to.throw(TypeORMError)
            .with.property("message")
            .that.matches(/Expo SDK v52/)
    })

    it("throws a TypeORMError when `openDatabaseAsync` is not a function", () => {
        const instance = makeDriver({ openDatabaseAsync: "nope" })
        expect(() => instance.loadDependencies()).to.throw(TypeORMError)
    })

    it("throws a TypeORMError when the driver is not an object (e.g. null)", () => {
        const instance = makeDriver(null)
        // `null ?? require(...)` falls through to require, which fails in Node
        // because `expo-sqlite` is not installed — we expect the package-not-
        // installed path, not the legacy-driver path.
        expect(() => instance.loadDependencies()).to.throw(
            DriverPackageNotInstalledError,
        )
    })

    it("throws DriverPackageNotInstalledError when no driver is passed and `expo-sqlite` is absent", () => {
        // Node test environment has no `expo-sqlite` installed — `require`
        // throws MODULE_NOT_FOUND which the try/catch surfaces as
        // DriverPackageNotInstalledError.
        const instance = makeDriver(undefined)
        expect(() => instance.loadDependencies())
            .to.throw(DriverPackageNotInstalledError)
            .with.property("message")
            .that.includes("expo-sqlite")
    })
})
