import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { DataSource } from "../../../src/data-source/DataSource";
import { expect } from "chai";
import { Item, NEW_COLLATION } from "./entity/item.entity";

describe("github issues > #8647 Collation changes are not synced to RDBMS", () => {
  let connections: DataSource[]

  before(
    async () =>
        (connections = await createTestingConnections({
            enabledDrivers: ["postgres"],
            driverSpecific: {
                applicationName: "collation-detection-test",
            },
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })),
  )
  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  const COLUMN_NAME = "name";

  it("ALTER ... COLATE query should be created", async () => {
    await Promise.all(connections.map(async (connection) => {
        // change metadata
        const meta = connection.getMetadata(Item);
        const col = meta.columns.find(c => c.propertyName === COLUMN_NAME)!;
        const OLD_COLLATION = col.collation;
        col.collation = NEW_COLLATION;

        // capture generated up queries
        const sqlInMemory = await connection.driver.createSchemaBuilder().log();
        const tableName = meta.tableName;
        const expectedUp = `ALTER TABLE \"${tableName}\" ALTER COLUMN \"${COLUMN_NAME}\" TYPE character varying COLLATE \"${NEW_COLLATION}\"`;
        const expectedDown = `ALTER TABLE \"${tableName}\" ALTER COLUMN \"${COLUMN_NAME}\" TYPE character varying COLLATE \"${OLD_COLLATION}\"`;

        // assert that the expected queries are in the generated SQL
        const upJoined = sqlInMemory.upQueries
          .map(q => q.query.replace(/\s+/g, ' ').trim())
          .join(' ');
        expect(upJoined).to.include(expectedUp);
        const downJoined = sqlInMemory.downQueries
          .map(q => q.query.replace(/\s+/g, ' ').trim())
          .join(' ');
        expect(downJoined).to.include(expectedDown);

        // assert that collation changes are applied to the database
        const queryRunner = connection.createQueryRunner();

        try {
          let table = await queryRunner.getTable(meta.tableName);
          const originColumn = table!.columns.find(c => c.name === COLUMN_NAME)!;
          // old collation should be appeared
          expect(originColumn.collation).to.equal(OLD_COLLATION);

          await connection.synchronize();

          table = await queryRunner.getTable(meta.tableName);
          const appliedColumn = table!.columns.find(c => c.name === COLUMN_NAME)!;
          // new collation should be appeared
          expect(appliedColumn.collation).to.equal(NEW_COLLATION);
        } finally {
            await queryRunner.release();
        }
      })
    )}
  );
})
