import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../src";

describe("github issues > #2096 [mysql] Database name isn't read from url", () => {
    it("should be possible to define a database by connection url for mysql", async () => {
        // it is important to synchronize here, to trigger EntityMetadataValidator.validate
        // that previously threw the error where the database on the driver object was undefined
        const connection = new Connection({
            name: "#2096",
            url: "mysql://root:admin@localhost:3306/test",
            entities: [__dirname + "/entity/*{.js,.ts}"],
            synchronize: true,
            type: "mysql"
        });
        expect(connection.isConnected).to.eq(true);
        await connection.close();
    });
});
