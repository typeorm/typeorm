import "reflect-metadata";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {expect} from "chai";

describe("multi-schema-and-database > custom-junction-schema", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [Post, Category],
            enabledDrivers: ["mssql", "postgres"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create tables when custom table schema used", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const postTable = await queryRunner.getTable("yoman.post");
        const categoryTable = await queryRunner.getTable("yoman.category");
        const junctionMetadata = connection.getManyToManyMetadata(Post, "categories")!;
        const junctionTable = await queryRunner.getTable("yoman." + junctionMetadata.tableName);
        await queryRunner.release();

        expect(postTable).not.to.be.undefined;
        expect(postTable!.name).to.be.equal("post");
        expect(postTable!.schema).to.be.equal("yoman");

        expect(categoryTable).not.to.be.undefined;
        expect(categoryTable!.name).to.be.equal("category");
        expect(categoryTable!.schema).to.be.equal("yoman");

        expect(junctionTable).not.to.be.undefined;
        expect(junctionTable!.name).to.be.equal(junctionMetadata.tableName);
        expect(junctionTable!.schema).to.be.equal("yoman");
    })));

});
