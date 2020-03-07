import "reflect-metadata";
import { expect } from "chai";
import { createConnection, getConnectionManager } from "../../../src";

describe("github issues > #2096 [mysql] Database name isn't read from url", () => {
    it("should be possible to define a database by connection url for mysql", async () => {
        const connection = getConnectionManager().connections.find(
            c => c.name.indexOf("mysql") > -1
        );
        if (connection && connection.isConnected) {
            await connection.close();
        }
        // it is important to synchronize here, to trigger EntityMetadataValidator.validate
        // that previously threw the error where the database on the driver object was undefined
        const newConnection = await createConnection({
            url: "mysql://test:test@localhost:3306/test",
            entities: [__dirname + "/entity/*{.js,.ts}"],
            synchronize: true,
            type: "mysql"
        });
        expect(newConnection.isConnected).to.eq(true);
    });
});
