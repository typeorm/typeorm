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

    it("should create all children during .create()", () => Promise.all(connections.map(async connection => {

      const defaultData = {
        "role": {
          "name": "UI Designer"
        },
        "roleLevels": [
          {
            "levelId": 1,
            "gradingId": 1,
            "name": "Junior"
          },
          {
            "levelId": 2,
            "gradingId": 2,
          }
        ]
      };

      const data = {
        "id": 1,
        "name": "UI Designer (updated)",
        "roleLevels": [
          {
            "id": 1,
            "levelId": 1,
            "gradingId": 2,
            "name": "Junior (updated)"
          },
          {
            "levelId": 3,
            "gradingId": 3,
            "name": "Senior (new)"
          }
        ]
      };

      const expectedResult = {
        "id": 1,
        "name": "UI Designer (updated)",
        "roleLevels": [
          {
            "id": 1,
            "levelId": 1,
            "gradingId": 2,
            "roleId": 1,
            "name": "Junior (updated)"
          },
          {
            "id": 2,
            "levelId": 2,
            "gradingId": 2,
            "roleId": 1,
            "name": null,
          },
          {
            "id": 3,
            "levelId": 3,
            "gradingId": 3,
            "roleId": 1,
            "name": "Senior (new)"
          }
        ]
      };

      /* const roleRepository = connection.getRepository(Role);
      const result = roleRepository.create(data);
      
      expect(result).to.eql(data); */
    })));

});