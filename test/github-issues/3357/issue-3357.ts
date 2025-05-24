import "reflect-metadata";
import {
  createTestingConnections,
  closeTestingConnections,
  reloadTestingDatabases,
} from "../../utils/test-utils";
import { DataSource } from "../../../../src/data-source/DataSource";
import { expect } from "chai";

describe("github issues > #3357 ALTER-only column metadata", () => {
  let connections: DataSource[];

  before(async () => {
    connections = await createTestingConnections({
      entities: [__dirname + "/entity/*{.js,.ts}"],
      migrations: [],
      schemaCreate: true,
      dropSchema: true,
    });
  });

  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  it("should emit ALTER TABLE instead of DROP+ADD when only options change", async () => {
    for (const connection of connections) {
      const sqlInMemory = await connection.driver
        .createSchemaBuilder()
        .log();

      // look for an ALTER on your test entity’s column
      const hasAlter = sqlInMemory.upQueries
        .map(q => q.query)
        .some(sql => /ALTER TABLE .* ALTER COLUMN/.test(sql));

      expect(hasAlter).to.be.true;
    }
  });
});
