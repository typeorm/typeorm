import "reflect-metadata";
import {expect} from "chai";
import {Post} from "./entity/Post";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";

describe("database schema > column length > mssql", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["mysql"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("all types should create with correct size", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post");
        await queryRunner.release();

        expect(table!.findColumnByName("int")!.length).to.be.equal("5");
        expect(table!.findColumnByName("tinyint")!.length).to.be.equal("5");
        expect(table!.findColumnByName("smallint")!.length).to.be.equal("5");
        expect(table!.findColumnByName("mediumint")!.length).to.be.equal("5");
        expect(table!.findColumnByName("bigint")!.length).to.be.equal("5");
        expect(table!.findColumnByName("char")!.length).to.be.equal("50");
        expect(table!.findColumnByName("varchar")!.length).to.be.equal("50");
        
    })));

    it("all types should update their size", () => Promise.all(connections.map(async connection => {
        
        let metadata = connection.getMetadata(Post);
        metadata.findColumnWithPropertyName("int")!.length = "10";
        metadata.findColumnWithPropertyName("tinyint")!.length = "10";
        metadata.findColumnWithPropertyName("smallint")!.length = "10";
        metadata.findColumnWithPropertyName("mediumint")!.length = "10";
        metadata.findColumnWithPropertyName("bigint")!.length = "10";
        metadata.findColumnWithPropertyName("char")!.length = "100";
        metadata.findColumnWithPropertyName("varchar")!.length = "100";
        
        await connection.synchronize(false);        

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post");
        await queryRunner.release();

        expect(table!.findColumnByName("int")!.length).to.be.equal("10");
        expect(table!.findColumnByName("tinyint")!.length).to.be.equal("10");
        expect(table!.findColumnByName("smallint")!.length).to.be.equal("10");
        expect(table!.findColumnByName("mediumint")!.length).to.be.equal("10");
        expect(table!.findColumnByName("bigint")!.length).to.be.equal("10");
        expect(table!.findColumnByName("char")!.length).to.be.equal("100");
        expect(table!.findColumnByName("varchar")!.length).to.be.equal("100");
        
    })));

});
