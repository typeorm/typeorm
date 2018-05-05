import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";

import {Role} from "./entity/role.entity";

describe("github issues > #1993 Repository .create() with nested JSON, only one child goes through", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    const data = {
      name: "UI Designer",
      roleLevels: [
        {
          roleId: null,
          name: "Junior"
        },
        {
          roleId: null,
          name: null
        },
        {
          roleId: null,
          name: "Senior"
        }]
    };

    it("should create all children during .create()", () => Promise.all(connections.map(async connection => {

      const roleRepository = connection.getRepository(Role);
      const result = roleRepository.create(data);
      
      expect(result).to.eql(data);
    })));

});