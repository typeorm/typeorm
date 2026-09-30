import { expect } from "chai"

import { isTestingConnectionTypeEnabled } from "../../utils/test-utils"

describe("data source > testing driver selection", () => {
    it("expands PostgreSQL dialect suites to both client variants", () => {
        expect(
            isTestingConnectionTypeEnabled("postgres", ["postgres"]),
        ).to.equal(true)
        expect(
            isTestingConnectionTypeEnabled("postgres-js", ["postgres"]),
        ).to.equal(true)
    })

    it("keeps explicit Postgres.js selection connector-specific", () => {
        expect(
            isTestingConnectionTypeEnabled("postgres-js", ["postgres-js"]),
        ).to.equal(true)
        expect(
            isTestingConnectionTypeEnabled("postgres", ["postgres-js"]),
        ).to.equal(false)
    })

    it("does not alias CockroachDB or Aurora PostgreSQL", () => {
        expect(
            isTestingConnectionTypeEnabled("cockroachdb", ["postgres"]),
        ).to.equal(false)
        expect(
            isTestingConnectionTypeEnabled("aurora-postgres", ["postgres"]),
        ).to.equal(false)
    })
})
