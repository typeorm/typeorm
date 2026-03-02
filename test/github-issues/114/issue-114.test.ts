import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import type { PostgresDataSourceOptions } from "../../../src/driver/postgres/PostgresDataSourceOptions"

describe.skip("github issues > #114 Can not be parsed correctly the URL of pg.", () => {
    let connection: DataSource
    before(() => {
        connection = new DataSource({
            // Dummy Connection, won't be established
            type: "postgres",
            url: "postgres://test:test@localhost:5432/test",
        })
    })

    it("should not fail in url parser", () => {
        const options = connection.options as PostgresDataSourceOptions
        expect(options.username).to.be.eq("test")
        expect(options.password).to.be.eq("test")
        expect(options.host).to.be.eq("localhost")
        expect(options.port).to.be.eq(5432)
        expect(options.database).to.be.eq("test")
    })
})
