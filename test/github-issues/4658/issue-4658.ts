import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";

describe("query runner > rename column", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly rename column and revert rename", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("user");

        await queryRunner.renameColumn(table!, "created_at", "createdAt");
        await queryRunner.renameColumn(table!, "updated_at", "updatedAt");

        table = await queryRunner.getTable("user");
        expect(table!.findColumnByName("created_at")).to.be.undefined;
        expect(table!.findColumnByName("updated_at")).to.be.undefined;
        table!.findColumnByName("createdAt")!.should.be.exist;
        table!.findColumnByName("updatedAt")!.should.be.exist;

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("user");
        table!.findColumnByName("created_at")!.should.be.exist;
        table!.findColumnByName("updated_at")!.should.be.exist;
        expect(table!.findColumnByName("createdAt")).to.be.undefined;
        expect(table!.findColumnByName("updatedAt")).to.be.undefined;

        await queryRunner.release();
    })));

    it("should correctly remove column and revert it back", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("user");

        await queryRunner.dropColumn(table!, "created_at");
        await queryRunner.dropColumn(table!, "updated_at");

        table = await queryRunner.getTable("user");
        expect(table!.findColumnByName("created_at")).to.be.undefined;
        expect(table!.findColumnByName("updated_at")).to.be.undefined;

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("user");
        table!.findColumnByName("created_at")!.should.be.exist;
        table!.findColumnByName("updated_at")!.should.be.exist;

        await queryRunner.release();
    })));

});
