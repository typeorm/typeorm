import "reflect-metadata";
const sqlFormatter  = require("sql-formatter"); // use require because there"s no type definition
import * as sinon from "sinon";
import { AdvancedConsoleFormattedLogger } from "../../../src/logger/AdvancedConsoleFormattedLogger";
import { AdvancedConsoleLogger } from "../../../src/logger/AdvancedConsoleLogger";

describe("github issues > #1738 formatted advanced console debugger feature", () => {

    // Testing an SQL based driver.  If needed more tests could be made for other
    // specific drivers
    it("AdvancedConsoleFormattedLogger - logQuery - called with formatted Sql", () => {

        // spy on AdvancedConsoleLogger (super) calls
        const superLogQuerySpy = sinon.stub(AdvancedConsoleLogger.prototype, "logQuery");

        // setup logger and SQL
        const logger = new AdvancedConsoleFormattedLogger(true);
        const sql = "SELECT user.*, photo.* FROM users user JOIN photos photo ON photo.user = user.id AND .isRemoved = FALSE user.name = 'Timber'";

        // spy on AdvancedConsoleFormattedLogger
        const logQuerySpy = sinon.spy(logger, "logQuery");

        logger.logQuery(sql);

        sinon.assert.calledOnce(logQuerySpy);
        sinon.assert.calledOnce(superLogQuerySpy);
        sinon.assert.calledWith(logQuerySpy, sql);
        sinon.assert.calledWith(superLogQuerySpy, "\n" + sqlFormatter.format(sql) + "\n\n");
    });

});