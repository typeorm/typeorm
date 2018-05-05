import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";

import {Role} from "./entity/role.entity";

describe("github issues > #1989 Save after preload with cascade & eager returns also old children", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    const initialData = {
      role: {
        name: "UI Designer"
      },
      roleLevels: [
        {
          name: "Junior",
          roleId: null
        },
        {
          name: null,
          roleId: null
        }
      ]
    };

    const updateData = {
      id: 1,
      name: "UI Designer (updated)",
      roleLevels: [
        {
          id: 1,
          name: "Junior (updated)",
          roleId: 1
        },
        {
          name: "Senior (new)",
          roleId: 1
        }
      ]
    };

    const expectedResult = {
      id: 1,
      name: "UI Designer (updated)",
      roleLevels: [
        {
          id: 1,
          roleId: 1,
          name: "Junior (updated)"
        },
        {
          id: 2,
          roleId: 1,
          name: null,
        },
        {
          id: 3,
          roleId: 1,
          name: "Senior (new)"
        }
      ]
    };

    it("should not return also the children before update (duplicate entries)", () => Promise.all(connections.map(async connection => {

      const roleRepository = connection.getRepository(Role);
      await roleRepository.save(roleRepository.create(initialData));
      const updatedRole = await roleRepository.preload(updateData);
      if (!!updatedRole) {
        const result = await roleRepository.save(updatedRole);
        expect(result).to.eql(expectedResult);
      }
    })));

});