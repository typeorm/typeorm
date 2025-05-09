import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, 
    // reloadTestingDatabases
 } from "../../utils/test-utils";
import { DataSource } from "../../../src/data-source/DataSource";
import { expect } from "chai";
import { Item, NEW_COLLATION, OLD_COLLATION } from "./entity/item.entity";

describe("github issues > #8647 Collation changes are not synced to RDBMS", () => {

  let dataSources: DataSource[];

  beforeEach(
    async () => {
        dataSources = await createTestingConnections({
          entities: [Item],
          schemaCreate: true,
          dropSchema: true,
        });
    }
  );
  after(() => closeTestingConnections(dataSources));

  const COLUMN_NAME = "name";

  it("ALTER ... COLATE query should be created", () =>
    Promise.all(dataSources.map(async (dataSource) => {
      // Change Entity's collation
      const meta = dataSource.getMetadata(Item);
      const col = meta.columns.find(c => c.propertyName === COLUMN_NAME)!;
      col.collation = NEW_COLLATION;

      // Check Native Query Built by PostgresQueryRunner
      const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();
      const tableName = meta.tableName;
      const expectedUp = `ALTER TABLE "${tableName}" ALTER COLUMN "${
                            COLUMN_NAME
                        }" TYPE character varying COLLATE "${NEW_COLLATION}"`; // PostgresDriver's normalizeType method will convert varchar to character varying
      const expectedDown = `ALTER TABLE "${tableName}" ALTER COLUMN "${
                            COLUMN_NAME
                        }" TYPE character varying COLLATE "${OLD_COLLATION}"`;

      // Assert that the generated up quries are correct
      const upJoined = sqlInMemory.upQueries
        .map(q => q.query.replace(/\s+/g, ' ').trim())
        .join(' ');
        // console.log(`Native Query Result => ${upJoined}`)
        // console.log(`expected Query => ${expectedUp}`)
      expect(upJoined).to.include(expectedUp);

      // Assert that the generated down quries are correct
      const downJoined = sqlInMemory.downQueries
        .map(q => q.query.replace(/\s+/g, ' ').trim())
        .join(' ');
      expect(downJoined).to.include(expectedDown);
    }))
  );

  it("collation update should be applied after synchronize", () =>
    Promise.all(dataSources.map(async (dataSource) => {
      // Change Entity's collation
      const meta = dataSource.getMetadata(Item);
      const col = meta.columns.find(c => c.propertyName === COLUMN_NAME)!;
      col.collation = NEW_COLLATION;
      await dataSource.synchronize();
      
      // Assert that the collation is applied to the DB
      const qr = dataSource.createQueryRunner();
      try {
        const table = await qr.getTable(meta.tableName);
        const appliedCol = table!.columns.find(c => c.name === COLUMN_NAME)!;
        // console.log(`Applied collation => ${appliedCol.collation}`)
        // console.log(`expected collation => ${NEW_COLLATION}`)
        expect(appliedCol.collation).to.equal(NEW_COLLATION);
      } finally {
        await qr.release();
      }
    }))
  );

});
