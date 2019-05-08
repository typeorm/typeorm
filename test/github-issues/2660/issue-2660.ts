import "reflect-metadata";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import { Snow } from "./entity/Snow";

describe("github issues > #2660 adding affected rows to insert and update result", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        enabledDrivers: ["postgres"],
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should have return the number of affected rows after insert and update", () => Promise.all(connections.map(async connection => {

      let Jon = new Snow();
      Jon.id = 1;
      Jon.name = "Jon";
      Jon.house = "Stark";

      const repo = await connection.getRepository(Snow);
      
      const insertResult = await repo.insert(Jon);
      expect(insertResult!.raw).to.equal(1);

      const updateResult = await repo.update({id: Jon.id}, {name: "Aegon", house: "Targaryen"});
      expect(updateResult!.raw).to.equal(1);

      const updateResultWithoutAffect = await repo.update({id: 2}, {name: "Aegon", house: "Targaryen"});
      expect(updateResultWithoutAffect!.raw).to.equal(0);

    })));

});
