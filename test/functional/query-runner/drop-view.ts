import "reflect-metadata";
import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { View } from "../../../src/schema-builder/view/View";
import { expect } from "chai";

describe("query runner > create and drop", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create view and revert creation", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const v = new View({
            name: "test_view",
            expression: "SELECT 1 as id"
        });
        await queryRunner.createView(v);

        await queryRunner.executeMemoryDownSql();

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        await queryRunner.dropView("test_view");

        const viewFromDb = await queryRunner.getView("test_view");

        expect(viewFromDb).to.be.undefined;

        await queryRunner.release();
    })));

    it("should correctly create materialized view and revert creation", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const v = new View({
            name: "test_materialized_view",
            expression: "SELECT 1 as id",
            materialized: true
        });
        await queryRunner.createView(v);

        await queryRunner.executeMemoryDownSql();

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        // Let's check if view was actually materialized view
        await queryRunner.query("DROP VIEW test_materialized_view").should.be.rejected;

        await queryRunner.dropView(v);

        const viewFromDb = await queryRunner.getView("test_materialized_view");

        expect(viewFromDb).to.be.undefined;

        await queryRunner.release();
    })));

});
