import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Country} from "./entity/Country";
import {QueryFailedError} from "../../../src/error/QueryFailedError";

describe("github issues > #3125 Saving a record with the same primary key doesn't throw if the primary key isn't auto-generated", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should fail when inserting a record with the same primary key", () => Promise.all(connections.map(async connection => {

        const country1 = new Country();
        country1.code = "TO";
        country1.name = "TypeORM";
        await connection.manager.save(country1);

        const country2 = new Country();
        country2.code = "TO";
        country2.name = "TypeORM";
        await connection.manager.save(country2).should.be.rejectedWith(QueryFailedError);

    })));

});
