import "reflect-metadata";
import {expect} from "chai";
import {SqlServerDriver} from "../../../src/driver/sqlserver/SqlServerDriver";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import { Connection, Table } from "../../../src";
import {Post} from "./entity/Post";
import {Site} from "./entity/Site";

describe("github issues > #4646 Add support for temporal (slowly changing) tables", () => {

  let connections: Connection[];
  before(async () => connections = await createTestingConnections({
    entities: [ __dirname + "/entity/*{.js,.ts}" ],
    enabledDrivers: [ "mssql" ]
  }));
  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  it("should not create temporal table by default", () => Promise.all(connections.map(async connection => {
    const queryRunner = connection.createQueryRunner();
    if (connection.driver instanceof SqlServerDriver) {
      await queryRunner.createTable(new Table({
        name: "non_temporal",
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "title", type: "nvarchar(512)", isNullable: false },
          { name: "body", isNullable: false, type: "nvarchar(1024)" }
        ]
      })
    );

      let table = await queryRunner.getTable("non_temporal");
      let idColumn = table!.findColumnByName("id")!;
      expect(idColumn.isPrimary).to.be.true;
      expect(idColumn.isNullable).to.be.false;
      expect(idColumn.type).to.be.eq("int");

      expect(table!.findColumnByName("body")).to.exist;
      expect(table!.findColumnByName("title")).to.exist;
      expect(table!.findColumnByName("ValidTo")).to.be.undefined;
      expect(table!.findColumnByName("ValidFrom")).to.be.undefined;
      await queryRunner.executeMemoryDownSql();
    }
    await queryRunner.release();
  })));

  it("should create temporal table with parameters that overwrite the defaults", () => Promise.all(connections.map(async connection => {
    const queryRunner = connection.createQueryRunner();
    if (connection.driver instanceof SqlServerDriver) {
      await queryRunner.createTable(new Table({
        name: "dbo.article",
        temporal: {
          historicalTableName: "article_temporal",
          sysStartTimeColumnName: "valid_from",
          sysEndTimeColumnName: "valid_to"
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "title", type: "nvarchar(512)", isNullable: false },
          { name: "body", type: "nvarchar(1024)", isNullable: false }
        ]
      })
    );

      const table = await queryRunner.getTable("article");
      const historicalTable1 = await queryRunner.getTable("article_temporal");
      const idColumn = table!.findColumnByName("id")!;
      expect(idColumn.isPrimary).to.be.true;
      expect(idColumn.isNullable).to.be.false;
      expect(idColumn.type).to.be.eq("int");
      expect(historicalTable1).to.exist;

      expect(table!.findColumnByName("body")).to.be.exist;
      expect(table!.findColumnByName("title")).to.be.exist;
      const validFromColumn = table!.findColumnByName("valid_from")!;
      expect(validFromColumn).to.exist;
      expect(validFromColumn.type).to.be.equal("datetime2");
      const validToColumn = table!.findColumnByName("valid_to")!;
      expect(validToColumn).to.exist;
      expect(validToColumn.type).to.be.equal("datetime2");
      expect(validToColumn.precision).to.be.equal(3);
      expect(table!.findColumnByName("ValidTo")).to.be.undefined;
      expect(table!.findColumnByName("ValidFrom")).to.be.undefined;
      await queryRunner.executeMemoryDownSql();
    }
    await queryRunner.release();
  })));

  it("should create historical table", () => Promise.all(connections.map(async connection => {
    const queryRunner = connection.createQueryRunner();
    if (connection.driver instanceof SqlServerDriver) {
      let temporalTable = new Table({
        name: "new_temporal",
        temporal: {
          sysStartTimeColumnName: "ValidTo",
          sysEndTimeColumnName: "ValidFrom"
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "title", type: "nvarchar(512)", isNullable: false },
        ]
      });
      await queryRunner.createTable(temporalTable);

      let table = await queryRunner.getTable("new_temporal");
      let historicalTable = await queryRunner.getTable("new_temporal_historical");
      expect(table).to.exist;
      expect(historicalTable).to.exist;
      await queryRunner.executeMemoryDownSql();
    }
    await queryRunner.release();
  })));

  it("should create temporal table with default parameters", () => Promise.all(connections.map(async connection => {
    const queryRunner = connection.createQueryRunner();
    if (connection.driver instanceof SqlServerDriver) {
      await queryRunner.createTable(new Table({
        name: "articles",
        temporal: {
          sysStartTimeColumnName: "ValidTo",
          sysEndTimeColumnName: "ValidFrom"
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "title", type: "nvarchar(512)", isNullable: false },
          { name: "body", type: "nvarchar(1024)", isNullable: false }
        ]
      })
    );

      let table = await queryRunner.getTable("articles");
      let idColumn = table!.findColumnByName("id")!;
      expect(idColumn.isPrimary).to.be.true;
      expect(idColumn.isNullable).to.be.false;
      expect(idColumn.type).to.be.eq("int");

      expect(table!.findColumnByName("body")).to.be.exist;
      expect(table!.findColumnByName("title")).to.be.exist;
      const validFromColumn = table!.findColumnByName("ValidFrom")!;
      expect(validFromColumn).to.exist;
      expect(validFromColumn.type).to.be.equal("datetime2");
      expect(validFromColumn.isNullable).to.be.false;
      const validToColumn = table!.findColumnByName("ValidTo")!;
      expect(validToColumn).to.exist;
      expect(validToColumn.type).to.be.equal("datetime2");
      expect(validToColumn.isNullable).to.be.false;
      expect(validToColumn.precision).to.be.equal(3);
      await queryRunner.executeMemoryDownSql();
    }
    await queryRunner.release();
  })));

  it("should drop temporal table", () => Promise.all(connections.map(async connection => {
    let queryRunner = connection.createQueryRunner();
    if (connection.driver instanceof SqlServerDriver) {
      let temporalTable = new Table({
        name: "dbo.table_to_drop",
        temporal: {
          sysStartTimeColumnName: "ValidTo",
          sysEndTimeColumnName: "ValidFrom"
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "title", type: "nvarchar(512)", isNullable: false },
        ]
      });
      await queryRunner.createTable(temporalTable);

      let table = await queryRunner.getTable("table_to_drop");
      let historicalTable = await queryRunner.getTable("table_to_drop_historical");
      expect(table).to.exist;
      expect(historicalTable).to.exist;

      await queryRunner.dropTable(temporalTable);
      table = await queryRunner.getTable("table_to_drop");
      historicalTable = await queryRunner.getTable("table_to_drop_historical");
      expect(table).not.to.exist;
      expect(historicalTable).not.to.exist;
      await queryRunner.executeMemoryDownSql();
    }
    await queryRunner.release();
  })));


  xit("should drop temporal based on table name", () => Promise.all(connections.map(async connection => {
    if (connection.driver instanceof SqlServerDriver) {
      let queryRunner = connection.driver.createQueryRunner();
      let temporalTable = new Table({
        name: "dbo.hist_table",
        temporal: {
          sysStartTimeColumnName: "ValidTo",
          sysEndTimeColumnName: "ValidFrom"
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "title", type: "nvarchar(512)", isNullable: false },
        ]
      });
      await queryRunner.createTable(temporalTable);

      let table = await queryRunner.getTable("hist_table");
      let historicalTable = await queryRunner.getTable("hist_table_historical");
      expect(table).to.exist;
      expect(historicalTable).to.exist;
      await queryRunner.dropTable("dbo.hist_table");
      table = await queryRunner.getTable("hist_table");
      historicalTable = await queryRunner.getTable("hist_table_historical");
      expect(table).not.to.exist;
      expect(historicalTable).not.to.exist;
      await queryRunner.executeMemoryDownSql();
      await queryRunner.release();
    }
  })));

  it("disableTemporalTable should remove temporal constraints from a given table", () => Promise.all(connections.map(async connection => {
    if (connection.driver instanceof SqlServerDriver) {
      const queryRunner = connection.driver.createQueryRunner();
      const temporalTable1 = new Table({
        name: "dbo.temporal_1",
        temporal: {
          sysStartTimeColumnName: "ValidTo",
          sysEndTimeColumnName: "ValidFrom"
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "title", type: "nvarchar(512)", isNullable: false },
        ]
      });

      const temporalTable2 = new Table({
        name: "dbo.temporal_2",
        temporal: {
          historicalTableName: "temp2_historical",
          sysStartTimeColumnName: "ValidTo",
          sysEndTimeColumnName: "ValidFrom"
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "title", type: "nvarchar(512)", isNullable: false },
        ]
      });
      await queryRunner.createTable(temporalTable1);
      await queryRunner.createTable(temporalTable2);

      expect(await queryRunner.getTemporalTables()).not.to.be.empty;
      const table1 = await queryRunner.getTable("temporal_1");
      const historicalTable1 = await queryRunner.getTable("temporal_1_historical");
      expect(table1).to.exist;
      expect(historicalTable1).to.exist;

      const table2 = await queryRunner.getTable("temporal_2");
      const historicalTable2 = await queryRunner.getTable("temp2_historical");
      expect(table2).to.exist;
      expect(historicalTable2).to.exist;

      await queryRunner.disableTemporalTable(temporalTable1);
      await queryRunner.disableTemporalTable(temporalTable2);
      const temporalTables = await queryRunner.getTemporalTables();
      expect(temporalTables.find(t => t.TABLE_NAME === "temporal_1")).to.be.undefined;
      expect(temporalTables.find(t => t.TABLE_NAME === "temporal_2")).to.be.undefined;
      await queryRunner.executeMemoryDownSql();
      await queryRunner.release();
    }
  })));


  it("disableTemporalTable should remove temporal constraints from a given table", () => Promise.all(connections.map(async connection => {
    if (connection.driver instanceof SqlServerDriver) {
      const queryRunner = connection.driver.createQueryRunner();
      const temporalTable1 = new Table({
        name: "dbo.temporal_1",
        temporal: {
          sysStartTimeColumnName: "ValidTo",
          sysEndTimeColumnName: "ValidFrom"
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "title", type: "nvarchar(512)", isNullable: false },
        ]
      });

      const temporalTable2 = new Table({
        name: "dbo.temporal_2",
        temporal: {
          historicalTableName: "temp2_historical",
          sysStartTimeColumnName: "ValidTo",
          sysEndTimeColumnName: "ValidFrom"
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "title", type: "nvarchar(512)", isNullable: false },
        ]
      });
      await queryRunner.createTable(temporalTable1);
      await queryRunner.createTable(temporalTable2);
      expect(await queryRunner.getTemporalTables()).to.not.be.empty;

      const table1 = await queryRunner.getTable("temporal_1");
      const historicalTable1 = await queryRunner.getTable("temporal_1_historical");
      expect(table1).to.exist;
      expect(historicalTable1).to.exist;

      const table2 = await queryRunner.getTable("temporal_2");
      const historicalTable2 = await queryRunner.getTable("temp2_historical");
      expect(table2).to.exist;
      expect(historicalTable2).to.exist;
      await queryRunner.disableAllTemporalTables();
      const temporalTables = await queryRunner.getTemporalTables();
      expect(temporalTables.length).to.be.lessThan(2);
      await queryRunner.executeMemoryDownSql();
      await queryRunner.release();
    }
  })));

  it("valid_to and valid_from should not be null", () => Promise.all(connections.map(async connection => {
    if (connection.driver instanceof SqlServerDriver) {
      const queryRunner = connection.driver.createQueryRunner();
      const post = new Post();
      post.title = "My Post";
      post.body = "Body of my post with some description";
      await connection.manager.save(post);
      const loadedPost = await connection.manager.findOne(Post, { where: { title: "My Post" } });
      const posts = await queryRunner.query("SELECT * from dbo.posts");
      expect(loadedPost!).not.to.be.undefined;
      expect(posts[ 0 ].valid_to).not.to.be.undefined;
      expect(posts[ 0 ].valid_from).not.to.be.undefined;
      expect(posts[ 0 ].body).to.equal("Body of my post with some description");
    }
  })));

  it("should not raise error if start/end time columns are defined within entity", () => Promise.all(connections.map(async connection => {
    if (connection.driver instanceof SqlServerDriver) {
      const post = new Post();
      post.title = "My Post";
      post.body = "Body of my post with some description";
      await connection.manager.save(post);
      const loadedPost = await connection.manager.findOne(Post, { where: { title: "My Post" } });
      expect(loadedPost!).not.to.be.undefined;
      connection.createQueryRunner().executeMemoryDownSql();
    }
  })));

  it("should properly create all associated metadata objects and properties", () => Promise.all(connections.map(async connection => {
    if (connection.driver instanceof SqlServerDriver) {
      let { Site } = require("./entity/Site");
      const site = new Site();
      site.name = "My Site";
      site.tag = "my_site";
      await connection.manager.save(site);
      const loadedSite = await connection.manager.findOne(Site, { where: { ValidTo: "9999-12-31 23:59:59.999" } });

      expect(loadedSite!).not.to.be.undefined;
      expect(loadedSite!.ValidTo).not.to.be.undefined;

      const siteMetadata = connection.getMetadata(Site);

      expect(siteMetadata.temporal!).not.to.be.undefined;
      expect(siteMetadata.temporal!.historicalTableName).to.be.equal("sites_temporal");
      expect(siteMetadata.temporal!.sysStartTimeColumnName).to.be.equal("ValidFrom");
      expect(siteMetadata.temporal!.sysEndTimeColumnName).to.be.equal("ValidTo");
      connection.createQueryRunner().executeMemoryDownSql();
      }
    })
  ));

  it("should set default valid to/from params", () => Promise.all(connections.map(async connection => {
    const siteMetadata = connection.getMetadata(Site);
    expect(siteMetadata.temporal!.defaultColumnSettings).to.be.deep
      .equal({
        type: "datetime2",
        nullable: false,
        select: true,
        insert: true,
        update: true,
        precision: 3
      });
    })
  ));

  it("should contain tableMetadataArgs", () => Promise.all(connections.map(async connection => {
      const siteMetadata = connection.getMetadata(Site);
      expect(siteMetadata.tableMetadataArgs.temporal!).to.be.deep
        .equal( { historicalTableName:    "sites_temporal",
                  sysStartTimeColumnName: "ValidFrom",
                  sysEndTimeColumnName:   "ValidTo" });
    })
  ));

  it("should add start/end columns to properties maps", () => Promise.all(connections.map(async connection => {
    const siteMetadata = connection.getMetadata(Site);
    expect(siteMetadata.propertiesMap).to.be.deep.equal({
      id: "id",
      name: "name",
      tag: "tag",
      ValidFrom: "ValidFrom",
      ValidTo: "ValidTo"
    });
  })));


  it("should handle schema synchronization with temporal tables", () => Promise.all(connections.map(async connection => {
    if (connection.driver instanceof SqlServerDriver) {
      const queryRunner = connection.driver.createQueryRunner();
      const commentsTable = new Table({
        name: "comments",
        temporal: {
          historicalTableName: "commentsHistorical",
          sysStartTimeColumnName: "sysStartTimeColumnName",
          sysEndTimeColumnName: "sysEndTimeColumnName"
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
          { name: "body", type: "nvarchar(1024)", isNullable: false },
          { name: "tag", type: "nvarchar(128)", isNullable: false }
        ]
      });
      await queryRunner.createTable(commentsTable);
      const { Comment } = require("./entity/Comment");
      const comment = new Comment();
      comment.body = "This code is awesome";
      comment.tag = "linux, security";
      await connection.manager.save(comment);
      const loadedComment = await connection.manager.findOne(Comment, { where: { body: "This code is awesome" } });
      expect(loadedComment!).not.to.be.undefined;

      await queryRunner.executeMemoryDownSql();
      await queryRunner.release();
    }
  })));

  it("should handle custom get date function if provided", () => Promise.all(connections.map(async connection => {
    if (connection.driver instanceof SqlServerDriver) {
      const queryRunner = connection.driver.createQueryRunner();
      const temporalTable1 = new Table({
        name: "dbo.temporal_1",
        temporal: {
          sysStartTimeColumnName: "ValidTo",
          sysEndTimeColumnName: "ValidFrom",
          getDateFunction: "getdate()"
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "title", type: "nvarchar(512)", isNullable: false },
        ]
      });

      await queryRunner.createTable(temporalTable1);
      expect(await queryRunner.getTemporalTables()).to.not.be.empty;

      const table1 = await queryRunner.getTable("temporal_1");
      const historicalTable1 = await queryRunner.getTable("temporal_1_historical");
      expect(table1).to.exist;
      const match = table1!.columns.filter(c => c.default === "getdate()");
      expect(match).to.not.be.empty;
      expect(match[ 0 ].name).to.be.equal("ValidTo");
      expect(historicalTable1).to.exist;

      await queryRunner.executeMemoryDownSql();
      await queryRunner.release();
    }
  })));


  it("should overwrite precision for valid _to/_from columns", () => Promise.all(connections.map(async connection => {
    const queryRunner = connection.createQueryRunner();
    if (connection.driver instanceof SqlServerDriver) {
      await queryRunner.createTable(new Table({
        name: "dbo.comments",
        temporal: {
          sysStartTimeColumnName: "valid_from",
          sysEndTimeColumnName: "valid_to",
          precision: 2
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "body", type: "nvarchar(1024)", isNullable: false }
        ]
      })
    );

      const table = await queryRunner.getTable("comments");
      const commentsTable = await queryRunner.getTable("comments_historical");
      expect(commentsTable).to.exist;
      expect(table!.findColumnByName("body")).to.be.exist;
      const validFromColumn = table!.findColumnByName("valid_from")!;
      expect(validFromColumn.precision).to.be.equal(2);
      expect(validFromColumn).to.exist;
      expect(validFromColumn.type).to.be.equal("datetime2");
      const validToColumn = table!.findColumnByName("valid_to")!;
      expect(validToColumn).to.exist;
      expect(validToColumn.type).to.be.equal("datetime2");
      expect(validToColumn.precision).to.be.equal(2);
      expect(table!.findColumnByName("ValidTo")).to.be.undefined;
      expect(table!.findColumnByName("ValidFrom")).to.be.undefined;
      await queryRunner.executeMemoryDownSql();
    }
    await queryRunner.release();
  })));


  it("should overwrite precision for valid _to/_from columns", () => Promise.all(connections.map(async connection => {
    const queryRunner = connection.createQueryRunner();
    if (connection.driver instanceof SqlServerDriver) {
      await queryRunner.createTable(new Table({
        name: "dbo.comments",
        temporal: {
          sysStartTimeColumnName: "valid_from",
          sysEndTimeColumnName: "valid_to",
          precision: 0
        },
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true },
          { name: "body", type: "nvarchar(1024)", isNullable: false }
        ]
      })
    );

      const table = await queryRunner.getTable("comments");
      const commentsTable = await queryRunner.getTable("comments_historical");
      expect(commentsTable).to.exist;
      expect(table!.findColumnByName("body")).to.be.exist;
      const validFromColumn = table!.findColumnByName("valid_from")!;
      expect(validFromColumn.precision).to.be.equal(0);
      expect(validFromColumn).to.exist;
      expect(validFromColumn.type).to.be.equal("datetime2");
      const validToColumn = table!.findColumnByName("valid_to")!;
      expect(validToColumn).to.exist;
      expect(validToColumn.type).to.be.equal("datetime2");
      expect(validToColumn.precision).to.be.equal(0);
      expect(table!.findColumnByName("ValidTo")).to.be.undefined;
      expect(table!.findColumnByName("ValidFrom")).to.be.undefined;
      await queryRunner.executeMemoryDownSql();
    }
    await queryRunner.release();
  })));

});
