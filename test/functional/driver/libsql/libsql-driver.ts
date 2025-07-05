import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import { LibsqlDriver } from "../../../../src/driver/libsql/LibsqlDriver"

describe("libsql driver", () => {
    it("should create driver successfully", () => {
        const dataSource = new DataSource({
            type: "libsql",
            url: "file:test.db",
            entities: [],
            synchronize: true,
            logging: false,
        })

        expect(dataSource.driver).to.be.instanceOf(LibsqlDriver)
    })

    it("should handle connection options correctly", () => {
        const dataSource = new DataSource({
            type: "libsql",
            url: "file:test.db",
            entities: [],
            synchronize: true,
            logging: false,
        })

        const driver = dataSource.driver as LibsqlDriver
        expect(driver.options.type).to.equal("libsql")
        expect(driver.options.url).to.equal("file:test.db")
    })
})
