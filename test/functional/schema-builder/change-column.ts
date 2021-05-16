import {expect} from "chai";
import "reflect-metadata";
import {Connection} from "../../../src";
import {AuroraDataApiDriver} from "../../../src/driver/aurora-data-api/AuroraDataApiDriver";
import {CockroachDriver} from "../../../src/driver/cockroachdb/CockroachDriver";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";
import {OracleDriver} from "../../../src/driver/oracle/OracleDriver";
import {PostgresDriver} from "../../../src/driver/postgres/PostgresDriver";
import {SapDriver} from "../../../src/driver/sap/SapDriver";
import {AbstractSqliteDriver} from "../../../src/driver/sqlite-abstract/AbstractSqliteDriver";
import {SqlServerDriver} from "../../../src/driver/sqlserver/SqlServerDriver";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Post} from "./entity/Post";
import {PostVersion} from "./entity/PostVersion";

describe("schema builder > change column", () => {

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

    it("should correctly change column name", () => Promise.all(connections.map(async connection => {
        const postMetadata = connection.getMetadata(Post);
        const nameColumn = postMetadata.findColumnWithPropertyName("name")!;
        nameColumn.propertyName = "title";
        nameColumn.build(connection);

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const postTable = await queryRunner.getTable("post");
        await queryRunner.release();

        expect(postTable!.findColumnByName("name")).to.be.undefined;
        postTable!.findColumnByName("title")!.should.be.exist;

        // revert changes
        nameColumn.propertyName = "name";
        nameColumn.build(connection);
    })));

    it("should correctly change column length", () => Promise.all(connections.map(async connection => {
        const postMetadata = connection.getMetadata(Post);
        const nameColumn = postMetadata.findColumnWithPropertyName("name")!;
        const textColumn = postMetadata.findColumnWithPropertyName("text")!;
        nameColumn.length = "500";
        textColumn.length = "300";

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const postTable = await queryRunner.getTable("post");
        await queryRunner.release();

        postTable!.findColumnByName("name")!.length.should.be.equal("500");
        postTable!.findColumnByName("text")!.length.should.be.equal("300");

        if (connection.driver instanceof MysqlDriver || connection.driver instanceof AuroraDataApiDriver || connection.driver instanceof SapDriver) {
            postTable!.indices.length.should.be.equal(2);
        } else {
            postTable!.uniques.length.should.be.equal(2);
        }

        // revert changes
        nameColumn.length = "255";
        textColumn.length = "255";
    })));

    it("should correctly change column type", () => Promise.all(connections.map(async connection => {

        const postMetadata = connection.getMetadata(Post);
        const versionColumn = postMetadata.findColumnWithPropertyName("version")!;
        versionColumn.type = "int";

        // in test we must manually change referenced column too, but in real sync, it changes automatically
        const postVersionMetadata = connection.getMetadata(PostVersion);
        const postVersionColumn = postVersionMetadata.findColumnWithPropertyName("post")!;
        postVersionColumn.type = "int";

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const postVersionTable = await queryRunner.getTable("post_version");
        await queryRunner.release();

        postVersionTable!.foreignKeys.length.should.be.equal(1);

        // revert changes
        versionColumn.type = "varchar";
        postVersionColumn.type = "varchar";
    })));

    it("should correctly make column primary and generated", () => Promise.all(connections.map(async connection => {
        // CockroachDB does not allow changing PK
        if (connection.driver instanceof CockroachDriver)
            return;

        const postMetadata = connection.getMetadata(Post);
        const idColumn = postMetadata.findColumnWithPropertyName("id")!;
        const versionColumn = postMetadata.findColumnWithPropertyName("version")!;
        idColumn.isGenerated = true;
        idColumn.generationStrategy = "increment";

        // SQLite does not support AUTOINCREMENT with composite primary keys
        // Oracle does not support both unique and primary attributes on such column
        if (!(connection.driver instanceof AbstractSqliteDriver) && !(connection.driver instanceof OracleDriver))
            versionColumn.isPrimary = true;

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const postTable = await queryRunner.getTable("post");
        await queryRunner.release();

        postTable!.findColumnByName("id")!.isGenerated.should.be.true;
        postTable!.findColumnByName("id")!.generationStrategy!.should.be.equal("increment");

        // SQLite does not support AUTOINCREMENT with composite primary keys
        if (!(connection.driver instanceof AbstractSqliteDriver) && !(connection.driver instanceof OracleDriver))
            postTable!.findColumnByName("version")!.isPrimary.should.be.true;

        // revert changes
        idColumn.isGenerated = false;
        idColumn.generationStrategy = undefined;
        versionColumn.isPrimary = false;
    })));

    it("should correctly change column `isGenerated` property when column is on foreign key", () => Promise.all(connections.map(async connection => {
        const teacherMetadata = connection.getMetadata("teacher");
        const idColumn = teacherMetadata.findColumnWithPropertyName("id")!;
        idColumn.isGenerated = false;
        idColumn.generationStrategy = undefined;

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const teacherTable = await queryRunner.getTable("teacher");
        await queryRunner.release();

        teacherTable!.findColumnByName("id")!.isGenerated.should.be.false;
        expect(teacherTable!.findColumnByName("id")!.generationStrategy).to.be.undefined;

        // revert changes
        idColumn.isGenerated = true;
        idColumn.generationStrategy = "increment";

    })));

    it("should correctly change non-generated column on to uuid-generated column", () => Promise.all(connections.map(async connection => {
        // CockroachDB does not allow changing PK
        if (connection.driver instanceof CockroachDriver)
            return;

        const queryRunner = connection.createQueryRunner();

        if (connection.driver instanceof PostgresDriver)
            await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        const postMetadata = connection.getMetadata(Post);
        const idColumn = postMetadata.findColumnWithPropertyName("id")!;
        idColumn.isGenerated = true;
        idColumn.generationStrategy = "uuid";

        // depending on driver, we must change column and referenced column types
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver) {
            idColumn.type = "uuid";
        } else if (connection.driver instanceof SqlServerDriver) {
            idColumn.type = "uniqueidentifier";
        } else {
            idColumn.type = "varchar";
        }

        await connection.synchronize();

        const postTable = await queryRunner.getTable("post");
        await queryRunner.release();

        if (connection.driver instanceof PostgresDriver || connection.driver instanceof SqlServerDriver || connection.driver instanceof CockroachDriver) {
            postTable!.findColumnByName("id")!.isGenerated.should.be.true;
            postTable!.findColumnByName("id")!.generationStrategy!.should.be.equal("uuid");

        } else {
            // other driver does not natively supports uuid type
            postTable!.findColumnByName("id")!.isGenerated.should.be.false;
            expect(postTable!.findColumnByName("id")!.generationStrategy).to.be.undefined;
        }

        // revert changes
        idColumn.isGenerated = false;
        idColumn.generationStrategy = undefined;
        idColumn.type = "int";
        postMetadata.generatedColumns.splice(postMetadata.generatedColumns.indexOf(idColumn), 1);
        postMetadata.hasUUIDGeneratedColumns = false;

    })));

    it("should correctly change generated column generation strategy", () => Promise.all(connections.map(async connection => {
        // CockroachDB does not allow changing PK
        if (connection.driver instanceof CockroachDriver)
            return;

        const teacherMetadata = connection.getMetadata("teacher");
        const studentMetadata = connection.getMetadata("student");
        const idColumn = teacherMetadata.findColumnWithPropertyName("id")!;
        const teacherColumn = studentMetadata.findColumnWithPropertyName("teacher")!;
        idColumn.generationStrategy = "uuid";

        // depending on driver, we must change column and referenced column types
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver) {
            idColumn.type = "uuid";
            teacherColumn.type = "uuid";
        } else if (connection.driver instanceof SqlServerDriver) {
            idColumn.type = "uniqueidentifier";
            teacherColumn.type = "uniqueidentifier";
        } else {
            idColumn.type = "varchar";
            teacherColumn.type = "varchar";
        }

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const teacherTable = await queryRunner.getTable("teacher");
        await queryRunner.release();

        if (connection.driver instanceof PostgresDriver || connection.driver instanceof SqlServerDriver) {
            teacherTable!.findColumnByName("id")!.isGenerated.should.be.true;
            teacherTable!.findColumnByName("id")!.generationStrategy!.should.be.equal("uuid");

        } else {
            // other driver does not natively supports uuid type
            teacherTable!.findColumnByName("id")!.isGenerated.should.be.false;
            expect(teacherTable!.findColumnByName("id")!.generationStrategy).to.be.undefined;
        }

        // revert changes
        idColumn.isGenerated = true;
        idColumn.generationStrategy = "increment";
        idColumn.type = "int";
        teacherColumn.type = "int";

    })));

    it("should correctly change column comment", () => Promise.all(connections.map(async connection => {
        // Skip thie contents of this test if not one of the drivers that support comments
        if (!(connection.driver instanceof CockroachDriver || connection.driver instanceof PostgresDriver || connection.driver instanceof MysqlDriver)) {
            return;
        }

        const teacherMetadata = connection.getMetadata("teacher");
        const idColumn = teacherMetadata.findColumnWithPropertyName("id")!;

        idColumn.comment = "The Teacher's Key";

        await connection.synchronize();

        const queryRunnerA = connection.createQueryRunner();
        const teacherTableA = await queryRunnerA.getTable("teacher");
        await queryRunnerA.release();

        expect(teacherTableA!.findColumnByName("id")!.comment).to.be.equal("The Teacher's Key", connection.name);

        // revert changes
        idColumn.comment = "";

        await connection.synchronize();

        const queryRunnerB = connection.createQueryRunner();
        const teacherTableB = await queryRunnerB.getTable("teacher");
        await queryRunnerB.release();

        expect(teacherTableB!.findColumnByName("id")!.comment).to.be.undefined;

    })));
});
