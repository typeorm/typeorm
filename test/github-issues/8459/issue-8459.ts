import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { DataSource } from "../../../src/data-source/DataSource"
import { assert } from "chai";
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner";
import { TableIndex } from "../../../src";

describe("github issues > #8459 Can not create indexes of materialized views", () => {

    const tableIndex: TableIndex = new TableIndex({
        columnNames: ['name'],
        name: 'name-idx'
    });

    const uniqueTableIndex: TableIndex = new TableIndex({
        columnNames: ['categoryName'],
        name: 'catname-idx',
        isUnique: true
    })

    let dataSources: DataSource[];
    before(async () => dataSources = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true
    }));
    beforeEach(() => reloadTestingDatabases(dataSources));
    after(() => closeTestingConnections(dataSources));

    it("should create a view index at runtime", () => Promise.all(dataSources.map(async dataSource => {
        const postgresQueryRunner: PostgresQueryRunner = <PostgresQueryRunner> dataSource.createQueryRunner();
        const views = await postgresQueryRunner.getViews([])
        assert.deepEqual(views[0].indices[0], tableIndex)
    })));

    it("should delete a view index", () => Promise.all(dataSources.map(async dataSource => {
        const postgresQueryRunner: PostgresQueryRunner = <PostgresQueryRunner> dataSource.createQueryRunner();
        let views = await postgresQueryRunner.getViews([])
        postgresQueryRunner.dropViewIndex(views[0], tableIndex)
        views = await postgresQueryRunner.getViews([])
        assert.isEmpty(views[0].indices)
    })));

    it("should create a view index", () => Promise.all(dataSources.map(async dataSource => {
        const postgresQueryRunner: PostgresQueryRunner = <PostgresQueryRunner> dataSource.createQueryRunner();
        let views = await postgresQueryRunner.getViews([])
        postgresQueryRunner.createViewIndex(views[0], tableIndex)
        views = await postgresQueryRunner.getViews([])
        assert.deepEqual(views[0].indices[0], tableIndex)
    })));

    it("should create a view unique index", () => Promise.all(dataSources.map(async dataSource => {
        const postgresQueryRunner: PostgresQueryRunner = <PostgresQueryRunner> dataSource.createQueryRunner();
        let views = await postgresQueryRunner.getViews([])
        postgresQueryRunner.createViewIndex(views[0], uniqueTableIndex)
        views = await postgresQueryRunner.getViews([])
        assert.deepEqual(views[0].indices[1], uniqueTableIndex)
    })));

});