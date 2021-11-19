import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {JsonTest} from "./entity/JsonTest";

describe("github issues > #8319 JSON string value will be parsed twice with mysql2", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should read output as input", async () => {

        for (const connection of connections) {
            const test = new JsonTest();

            test.jvalue = "hello";

            await connection.manager.save(test);

            expect((await connection.getRepository(JsonTest).findOne(test.id))!.jvalue).to.be.equal("hello");

            test.jvalue = 123;

            await connection.manager.save(test);

            expect((await connection.getRepository(JsonTest).findOne(test.id))!.jvalue).to.be.equal(123);

            test.jvalue = false;

            await connection.manager.save(test);

            expect((await connection.getRepository(JsonTest).findOne(test.id))!.jvalue).to.be.equal(false);

            test.jvalue = { name: "Mick" };

            await connection.manager.save(test);

            expect((await connection.getRepository(JsonTest).findOne(test.id))!.jvalue.name).to.be.equal("Mick");

            test.jvalue = null;

            await connection.manager.save(test);

            expect((await connection.getRepository(JsonTest).findOne(test.id))!.jvalue).to.be.equal(null);

            test.jvalue = [123, null, "Lot"];

            await connection.manager.save(test);

            expect((await connection.getRepository(JsonTest).findOne(test.id))!.jvalue[2]).to.be.equal("Lot");
        }
    });
});
