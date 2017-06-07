import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {SqlServerDriver} from "../../../src/driver/sqlserver/SqlServerDriver";
import {Logger} from "../../../src/logger/Logger";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";

describe("github issues > #453 Connect using Active Directory account", () => {

    let driver: SqlServerDriver;
    before(() => driver = new SqlServerDriver({
        type: "mssql",
        url: "mssql://domain~test:test@localhost:1234/test"
    }, new Logger({})));

    it("should not fail in url parser", () => {
        expect(driver.options.username).to.be.eq("test");
        expect(driver.options.password).to.be.eq("test");
        expect(driver.options.host).to.be.eq("localhost");
        expect(driver.options.port).to.be.eq(1234);
        expect(driver.options.database).to.be.eq("test");
        expect(driver.options.domain).to.be.eq("domain");
    });

    // you can add additional tests if needed

});
