import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import type { DataSourceOptions } from "../../../src/data-source/DataSourceOptions"
import { PostgresUtils } from "../../../src/driver/postgres/PostgresUtils"
import {
    closeTestingConnections,
    createTestingConnections,
    setupSingleTestingConnection,
} from "../../utils/test-utils"

describe("driver > session parameters validation", () => {
    it("should throw on an invalid session parameter name", () => {
        expect(() =>
            PostgresUtils.buildSessionParametersHandler({ "bad name!": "x" }),
        ).to.throw(/Invalid session parameter name/)
    })

    it("should throw on a null or undefined value", () => {
        expect(() =>
            PostgresUtils.buildSessionParametersHandler({
                statement_timeout: undefined,
            }),
        ).to.throw(/must not be null or undefined/)
    })

    it("should accept a namespaced (dotted) parameter name", () => {
        expect(() =>
            PostgresUtils.buildSessionParametersHandler({
                "my_app.setting": "x",
            }),
        ).to.not.throw()
    })

    it("should return undefined when nothing is configured", () => {
        expect(PostgresUtils.buildSessionParametersHandler(undefined)).to.be
            .undefined
    })
})

describe("postgres driver > session parameters", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb"],
            driverSpecific: {
                sessionParameters: {
                    application_name: "typeorm_session_parameters_test",
                },
            },
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should apply configured session parameters on pooled connections", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const result = await dataSource.query("SHOW application_name")
                expect(result[0].application_name).to.equal(
                    "typeorm_session_parameters_test",
                )
            }),
        ))
})

describe("driver > session parameters > invalid configuration", () => {
    it("should fail initialization when a session parameter cannot be applied", async () => {
        const options = setupSingleTestingConnection("cockroachdb", {
            entities: [],
        })
        // Skip when cockroachdb is not enabled in this environment.
        if (!options) return

        const dataSource = new DataSource({
            ...options,
            // Valid identifier, but not a real parameter: it passes up-front
            // validation and fails at set_config runtime, which must fail
            // initialization rather than leaving connections unconfigured.
            sessionParameters: { not_a_real_session_parameter: "x" },
        } as DataSourceOptions)

        let error: unknown
        try {
            await dataSource.initialize()
        } catch (err) {
            error = err
        } finally {
            if (dataSource.isInitialized) await dataSource.destroy()
        }

        expect(error, "initialize() should have rejected").to.not.be.undefined
    })
})
