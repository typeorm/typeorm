import "reflect-metadata";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { User } from "./entity/User";
import { expect } from "chai";
import { OracleDriver } from "../../../src/driver/oracle/OracleDriver";

describe("github issues > #4452 InsertQueryBuilder fails on some SQL Expressions values", () => {
    let connections: Connection[];
    before(
        async () =>
            (connections = await createTestingConnections({
                // enabledDrivers: ["postgres"],
                entities: [User],
                dropSchema: true
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));
    it("should be able to use sql functions", () => Promise.all(connections.map(async connection => {

      await connection.createQueryBuilder()
          .insert()
          .into(User)
          .values({
              name: "Ben Dover",
              created_at: connection.driver instanceof OracleDriver ? () => "SYSDATE" : () => "current_timestamp"
          })
          .execute();

      const loadedUser1 = await connection.getRepository(User).findOne({ name: "Ben Dover" });
      expect(loadedUser1).to.exist;
      loadedUser1!.created_at.should.be.instanceOf(Date);

  })));
});
