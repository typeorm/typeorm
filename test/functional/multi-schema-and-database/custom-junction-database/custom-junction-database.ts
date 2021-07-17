import "reflect-metadata";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {expect} from "chai";
import {SqlServerDriver} from "../../../../src/driver/sqlserver/SqlServerDriver";

describe("multi-schema-and-database > custom-junction-database", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [Post, Category],
            enabledDrivers: ["mysql"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create tables when custom table schema used", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        if (connection.driver instanceof SqlServerDriver) {
            const postTable = await queryRunner.getTable("yoman..post");
            const categoryTable = await queryRunner.getTable("yoman..category");
            const junctionMetadata = connection.getManyToManyMetadata(Post, "categories")!;
            const junctionTable = await queryRunner.getTable("yoman.." + junctionMetadata.tableName);
            expect(postTable).not.to.be.undefined;
            expect(postTable!.name).to.be.equal("post");
            expect(postTable!.database).to.be.equal("yoman");

            expect(categoryTable).not.to.be.undefined;
            expect(categoryTable!.name).to.be.equal("category");
            expect(categoryTable!.database).to.be.equal("yoman");

            expect(junctionTable).not.to.be.undefined;
            expect(categoryTable!.name).to.be.equal(junctionMetadata.tableName);
            expect(categoryTable!.database).to.be.equal("yoman");

        } else { // mysql
            const postTable = await queryRunner.getTable("yoman.post");
            const categoryTable = await queryRunner.getTable("yoman.category");
            const junctionMetadata = connection.getManyToManyMetadata(Post, "categories")!;
            const junctionTable = await queryRunner.getTable("yoman." + junctionMetadata.tableName);

            expect(postTable).not.to.be.undefined;
            expect(postTable!.name).to.be.equal("post");
            expect(postTable!.database).to.be.equal("yoman");

            expect(categoryTable).not.to.be.undefined;
            expect(categoryTable!.name).to.be.equal("category");
            expect(categoryTable!.database).to.be.equal("yoman");

            expect(junctionTable).not.to.be.undefined;
            expect(junctionTable!.name).to.be.equal(junctionMetadata.tableName);
            expect(junctionTable!.database).to.be.equal("yoman");
        }
        await queryRunner.release();
    })));

});
