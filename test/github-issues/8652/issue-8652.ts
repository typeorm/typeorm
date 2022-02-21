import "reflect-metadata";

import { expect } from "chai";

import { Connection } from "../../../src/connection/Connection";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import MyEntity from './entity/MyEntity';


describe("github issues > #8652 Custom transformer overwritten for certain column types", () => {
  let connections: Connection[];

  before(async () => connections = await createTestingConnections({
    entities: [__dirname + "/entity/*{.js,.ts}"],
    schemaCreate: true,
    dropSchema: true,
  }));
  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  it(
    "should transform column directly into SQL",
    () => Promise.all(connections.map(async connection => {
      const query = connection.createQueryBuilder()
        .insert()
        .into(MyEntity)
        .values({
          sample: new Date(0),
        });

      expect(query.getQueryAndParameters()[1][0]).to.equal('1970-01-02 00:00:00');
    })),
  );

  it(
    "should transform column directly from SQL",
    () => Promise.all(connections.map(async connection => {
      await connection.manager.insert(MyEntity, {
        sample: new Date(0),
      });

      const item = (await connection.manager.findOne(MyEntity))!;
      expect(item.sample.getTime()).to.equal(86460000);
    })),
  );
});
