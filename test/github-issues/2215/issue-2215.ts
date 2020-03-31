import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Record} from "./entity/Record";
import {expect} from "chai";

describe("github issues > #2215 Inserting id (primary column) from code.", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should auto generate ids as expected", () => Promise.all(connections.map(async connection => {
        const recordRepository = connection.manager.getRepository(Record);
        const { identifiers } = await recordRepository.insert({});
        expect(identifiers[0].id).to.equal(1);
    })));

    it("should allow ids to be inserted directly", () => Promise.all(connections.map(async connection => {
        const recordRepository = connection.manager.getRepository(Record);
        const { identifiers } = await recordRepository.insert({id: 5});
        expect(identifiers[0].id).to.equal(5);
    })));

});
