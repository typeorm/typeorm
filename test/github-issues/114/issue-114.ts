import "reflect-metadata";
import {PostgresDriver} from "../../../src/driver/postgres/PostgresDriver";
import {expect} from "chai";
import {Connection} from "../../../src/connection/Connection";
import {PostgresConnectionOptions} from "../../../src/driver/postgres/PostgresConnectionOptions";

describe("github issues > #114 Can not be parsed correctly the URL of pg.", () => {

    let driver: PostgresDriver, connection: Connection;
    before(() => {
        connection = new Connection({
            type: "postgres",
            url: "postgres://test:test@localhost:5432/test",
        });
        driver = new PostgresDriver(connection);
    });

    it("should not fail in url parser", () => {
        const options = connection.options as PostgresConnectionOptions;
        expect(options.username).to.be.eq("test");
        expect(options.password).to.be.eq("test");
        expect(options.host).to.be.eq("localhost");
        expect(options.port).to.be.eq(5432);
        expect(options.database).to.be.eq("test");
    });

});
