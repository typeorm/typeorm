import { expect } from "chai"
import * as sinon from "sinon"
import type postgres from "postgres"

import { DataSource } from "../../../src/data-source/DataSource"
import type { DataSourceOptions } from "../../../src/data-source/DataSourceOptions"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import type { PostgresJsDataSourceOptions } from "../../../src/driver/postgres/PostgresJsDataSourceOptions"
import { PlatformTools } from "../../../src/platform/PlatformTools"

describe("PostgresDriver client selection", () => {
    let sandbox: sinon.SinonSandbox

    beforeEach(() => {
        sandbox = sinon.createSandbox()
    })

    afterEach(() => {
        sandbox.restore()
    })

    it("accepts public postgres-js options and creates the shared driver", () => {
        type PgOnlyKeysAreAbsent =
            Extract<
                keyof PostgresJsDataSourceOptions,
                "nativeDriver" | "poolErrorHandler"
            > extends never
                ? true
                : false
        const pgOnlyKeysAreAbsent: PgOnlyKeysAreAbsent = true
        const injected = (() => undefined) as unknown as typeof postgres
        const options = {
            type: "postgres-js",
            database: "public-type-fixture",
            driver: injected,
        } satisfies DataSourceOptions

        const dataSource = new DataSource(options)

        expect(dataSource.driver).to.be.instanceOf(PostgresDriver)
        expect(pgOnlyKeysAreAbsent).to.equal(true)
        expect((dataSource.driver as PostgresDriver).postgres).to.equal(
            injected,
        )
    })

    it("loads postgres for postgres-js and accepts factory injection", () => {
        const load = sandbox.stub(PlatformTools, "load")
        const loaded = (() => undefined) as unknown as typeof postgres
        load.withArgs("postgres").returns(loaded)

        const loadedDataSource = new DataSource({
            type: "postgres-js",
            database: "loaded",
        })
        expect((loadedDataSource.driver as PostgresDriver).postgres).to.equal(
            loaded,
        )
        expect(load.calledOnceWithExactly("postgres")).to.equal(true)

        load.resetHistory()
        const injected = (() => undefined) as unknown as typeof postgres
        const injectedDataSource = new DataSource({
            type: "postgres-js",
            database: "injected",
            driver: injected,
        })
        expect((injectedDataSource.driver as PostgresDriver).postgres).to.equal(
            injected,
        )
        expect(load.notCalled).to.equal(true)
    })

    it("names postgres in the missing-package error", () => {
        sandbox.stub(PlatformTools, "load").throws(new Error("missing"))

        expect(
            () =>
                new DataSource({
                    type: "postgres-js",
                    database: "missing",
                }),
        )
            .to.throw()
            .with.property("message")
            .that.includes("postgres")
    })

    it("keeps postgres on pg and pg-native without loading the adapter", () => {
        const load = sandbox.stub(PlatformTools, "load")
        const native = { client: "pg-native" }
        const pg = { native }
        load.withArgs("pg").returns(pg)
        load.withArgs("pg-native").returns({})

        const dataSource = new DataSource({
            type: "postgres",
            database: "pg-path",
        })

        expect((dataSource.driver as PostgresDriver).postgres).to.equal(native)
        expect(load.calledWithExactly("pg")).to.equal(true)
        expect(load.calledWithExactly("pg-native")).to.equal(true)
        expect(load.neverCalledWith("postgres")).to.equal(true)
    })
})
