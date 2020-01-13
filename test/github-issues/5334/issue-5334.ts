import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";

import SomeEntityWithADate from "./entity/SomeEntityWithADate";


describe("github issues > #5334 Unable to perform find with where clause containing a date", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should findOne with Date without throwing an error", () => Promise.all(connections.map(async connection => {

        const date = new Date("2020-01-13");

        const someEntity = new SomeEntityWithADate();
        someEntity.someDateField = date;
        await connection.manager.save(someEntity);

        const repository = connection.getRepository(SomeEntityWithADate);

        const findSomeEntity = repository.findOne({
            where: {
                someDateField: date
            }
        });

        findSomeEntity.should.not.be.rejected;

        const entity = await findSomeEntity;

        expect(entity).to.not.be.null;

    })));

});
