import { DriverUtils } from "../../../src/driver/DriverUtils"
import { expect } from "chai"

describe("github issues > #6389 MongoDB URI Connection string with query params", () => {
    it("should parse correctly mongodb URI", () => {
        const obj: any = {
            type: "mongodb",
            username: "user",
            password: "password",
            host: "host",
            database: "database",
            port: 27017,
        }

        const url = `${obj.type}://${obj.username}:${obj.password}@${obj.host}:${obj.port}/${obj.database}?readPreference=primary`
        const options = DriverUtils.buildDriverOptions({ url })

        expect(options.type).to.eql(obj.type)
        expect(options.username).to.eql(obj.username)
        expect(options.username).to.eql(obj.username)
        expect(options.password).to.eql(obj.password)
        expect(options.host).to.eql(obj.host)
        expect(options.port).to.eql(obj.port)
        expect(options.database).to.eql(obj.database)
    })
})
