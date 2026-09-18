import "reflect-metadata";
import { expect } from "chai";
import { DataSource } from "../../../src/data-source/DataSource";
import { Entity, PrimaryColumn, Column } from "../../../src";
import { createTestingConnections, closeTestingConnections } from "../../utils/test-utils";

@Entity()
class Post {
    @PrimaryColumn()
    id: number;

    @Column({ length: "50" })
    name: string;
}

describe("github issues > #3357 TypeORM generates destructive migrations on length change", () => {
    let dataSources: DataSource[];
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres", "mysql"],
            schemaCreate: true,
            dropSchema: true
        });
    });
    after(() => closeTestingConnections(dataSources));

    it("should output ALTER TABLE instead of DROP COLUMN when changing length", async () => {
        for (const dataSource of dataSources) {
            await dataSource.synchronize(false);
            const postMetadata = dataSource.getMetadata(Post);
            const nameColumn = postMetadata.findColumnWithPropertyName("name")!;
            nameColumn.length = "100";
            
            const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();
            const queries = sqlInMemory.upQueries.map(q => q.query);
            
            
            const dropColumnQueries = queries.filter(q => q.includes("DROP COLUMN"));
            expect(dropColumnQueries.length).to.equal(0, `Found DROP COLUMN queries in ${dataSource.options.type}`);
            
            const alterTableQueries = queries.filter(q => q.includes("ALTER TABLE") || q.includes("CHANGE"));
            expect(alterTableQueries.length).to.be.greaterThan(0, `No ALTER TABLE / CHANGE query generated in ${dataSource.options.type}`);
        }
    });
});
