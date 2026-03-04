import { expect } from "chai"
import { DriverUtils } from "../../../src/driver/DriverUtils"
import { setupTestingConnections } from "../../utils/test-utils"

describe("github issues > #7437 MongoDB options never parse in connectionUrl and after my fix was parse incorrect", () => {
    it("should parse options in ConnectionUrl", function () {
        const isMongoTested =
            setupTestingConnections({ enabledDrivers: ["mongodb"] }).length > 0

        if (!isMongoTested) {
            return
        }

        const options = DriverUtils.buildMongoDBDriverOptions({
            url: "mongodb://testuser:testpwd@test-primary.example.com:27017/testdb?retryWrites=true&w=majority&useUnifiedTopology=true",
        })

        expect(options).to.deep.include({
            type: "mongodb",
            host: "test-primary.example.com",
            username: "testuser",
            password: "testpwd",
            port: 27017,
            database: "testdb",
            retryWrites: "true",
            w: "majority",
            useUnifiedTopology: "true",
        })
    })
})
